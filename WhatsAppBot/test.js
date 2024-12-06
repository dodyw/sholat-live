const whatsappBot = require('./index.js');

// Mock context for Azure Functions
const context = {
    log: console.log,
    error: console.error
};

// Test cases
const testMessages = [
    {
        name: "Default city (Surabaya)",
        body: createWhatsAppRequest("jadwal")
    },
    {
        name: "Single word city",
        body: createWhatsAppRequest("jadwal medan")
    },
    {
        name: "Two word city with space",
        body: createWhatsAppRequest("jadwal banda aceh")
    },
    {
        name: "Invalid city",
        body: createWhatsAppRequest("jadwal invalidcity")
    },
    {
        name: "Help message",
        body: createWhatsAppRequest("help")
    }
];

// Helper function to create WhatsApp request body
function createWhatsAppRequest(message) {
    return {
        object: "whatsapp_business_account",
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        from: "123456789",
                        text: {
                            body: message
                        }
                    }]
                }
            }]
        }]
    };
}

// Run tests
async function runTests() {
    console.log("Starting WhatsApp Bot Tests\n");
    
    for (const test of testMessages) {
        console.log(`Test: ${test.name}`);
        console.log("Message:", test.body.entry[0].changes[0].value.messages[0].text.body);
        
        try {
            const req = { body: test.body, method: 'POST' };
            await whatsappBot(context, req);
            console.log("Test passed successfully\n");
        } catch (error) {
            console.error("Test failed:", error, "\n");
        }
    }
}

// Set test environment
process.env.NODE_ENV = 'test';

// Run the tests
console.log("Starting tests...\n");
runTests().catch(console.error);
