const { app } = require('@azure/functions');

// Regex RFC 5322 simplifiée pour validation email
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.http('subscribe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'subscribe',
    handler: async (request, context) => {
        context.log('Newsletter subscription request received.');

        try {
            const body = await request.json();
            const email = (body.email || '').trim().toLowerCase();
            const consent = Boolean(body.consent);
            const lang = (body.lang || 'en').trim().toLowerCase().slice(0, 5);
            const source = (body.source || 'website_footer').trim();

            // 1. Validation email
            if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'INVALID_EMAIL',
                        message: 'A valid email address is required.'
                    }
                };
            }

            // 2. Validation consentement obligatoire et explicite (RGPD)
            if (!consent) {
                return {
                    status: 400,
                    jsonBody: {
                        success: false,
                        error: 'CONSENT_REQUIRED',
                        message: 'Explicit consent is mandatory for newsletter subscription.'
                    }
                };
            }

            // Métadonnées techniques conformes au principe de minimisation RGPD
            const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
            const timestamp = new Date().toISOString();

            context.log(`Subscription validated: ${email} (lang: ${lang}, source: ${source}, ip: ${clientIp}, time: ${timestamp})`);

            // 1. Relais vers n8n pour mise à jour de subscribers.csv & consent_proofs.csv sur Forgejo
            const n8nWebhookUrl = process.env.NEWSLETTER_N8N_WEBHOOK || 'https://n8n.geostratum.eu/webhook/newsletter-sync';
            if (n8nWebhookUrl) {
                try {
                    await fetch(n8nWebhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: source.includes('renewal') || source.includes('resubscribe') ? 'RENEWAL' : 'SUBSCRIBE',
                            email,
                            lang,
                            source,
                            consent: true,
                            consentText: source.includes('renewal') || source.includes('resubscribe') 
                                ? 'GDPR 3-year consent renewal confirmation' 
                                : 'Explicit consent given for GeoStratum newsletter',
                            clientIp,
                            timestamp
                        })
                    });
                } catch (n8nErr) {
                    context.error('Failed to notify n8n subscribe webhook:', n8nErr);
                }
            }

            // 2. Relais Webhook Discord pour notification de suivi
            const webhookUrl = process.env.NEWSLETTER_DISCORD_WEBHOOK || 'https://discord.com/api/webhooks/1557269394038726696/WGoPLHezZjQpOT6IJL31PAN2pQ3hCG2RZoVlktiqtZlegkqx9tnzt1AtmC4K5fxcs9Ae';
            if (webhookUrl) {
                const isRenewal = source.includes('renewal') || source.includes('resubscribe');
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: 'GeoStratum Newsletter Bot',
                            avatar_url: 'https://www.geostratum.eu/assets/logo_geostratum.svg',
                            embeds: [
                                {
                                    title: isRenewal ? '🔄 Renouvellement de Consentement RGPD (3 ans)' : '📥 Nouvelle Inscription Newsletter',
                                    color: isRenewal ? 10070709 : 65280, // Teal/Blue or Green
                                    fields: [
                                        { name: 'Email', value: `\`${email}\``, inline: false },
                                        { name: 'Langue', value: `\`${lang}\``, inline: true },
                                        { name: 'Source', value: source, inline: true },
                                        { name: 'IP Technique', value: `\`${clientIp}\``, inline: true },
                                        { name: 'Horodatage', value: timestamp, inline: true }
                                    ],
                                    footer: { text: 'GeoStratum • Architecture Zéro Port • RGPD Conforme' }
                                }
                            ]
                        })
                    });
                } catch (webhookErr) {
                    context.error('Failed to notify Discord webhook on subscribe:', webhookErr);
                }
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Subscription successful.'
                }
            };
        } catch (err) {
            context.error('Error handling subscription:', err);
            return {
                status: 400,
                jsonBody: {
                    success: false,
                    error: 'BAD_REQUEST',
                    message: 'Malformed request body.'
                }
            };
        }
    }
});
