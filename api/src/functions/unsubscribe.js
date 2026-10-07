const { app } = require('@azure/functions');

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.http('unsubscribe', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'unsubscribe',
    handler: async (request, context) => {
        context.log('Newsletter unsubscribe request received.');

        try {
            const body = await request.json();
            const email = (body.email || '').trim().toLowerCase();
            const source = (body.source || 'unsubscribe_page').trim();

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

            const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
            const timestamp = new Date().toISOString();

            context.log(`Unsubscribe processed: ${email} (source: ${source}, ip: ${clientIp}, time: ${timestamp})`);

            // Relais Webhook Discord (ou n8n) pour la notification instantanée de désinscription et mise à jour de la base
            const webhookUrl = process.env.NEWSLETTER_DISCORD_WEBHOOK || 'https://discord.com/api/webhooks/1557269394038726696/WGoPLHezZjQpOT6IJL31PAN2pQ3hCG2RZoVlktiqtZlegkqx9tnzt1AtmC4K5fxcs9Ae';
            if (webhookUrl) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: 'GeoStratum Newsletter Bot',
                            avatar_url: 'https://www.geostratum.eu/assets/logo_geostratum.svg',
                            embeds: [
                                {
                                    title: '📤 Demande de Désinscription (1-clic RGPD)',
                                    color: 15158332, // Red / Warning color (#E74C3C)
                                    fields: [
                                        { name: 'Email à retirer', value: `\`${email}\``, inline: false },
                                        { name: 'Source', value: source, inline: true },
                                        { name: 'Action', value: '🚫 Retrait immédiat de la liste de diffusion', inline: false },
                                        { name: 'IP Technique', value: `\`${clientIp}\``, inline: true },
                                        { name: 'Horodatage', value: timestamp, inline: true }
                                    ],
                                    footer: { text: 'GeoStratum • Architecture Zéro Port • Droit d’opposition RGPD' }
                                }
                            ]
                        })
                    });
                } catch (webhookErr) {
                    context.error('Failed to notify Discord webhook on unsubscribe:', webhookErr);
                }
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Unsubscribe successful.'
                }
            };
        } catch (err) {
            context.error('Error handling unsubscribe:', err);
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
