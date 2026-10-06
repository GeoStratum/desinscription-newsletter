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

            // Ici brancher la mise à jour (relai n8n / suppression base)
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
