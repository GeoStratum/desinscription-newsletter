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

            // Ici sera branché le relais (webhook vers n8n ou envoi email technique vers Freebox/OVH)
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
