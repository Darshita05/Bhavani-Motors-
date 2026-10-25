require("dotenv").config();
const axios = require("axios");

const {
  WA_PHONE_NUMBER_ID,
  WA_ACCESS_TOKEN,
  WA_TEMPLATE_NAME,
  WA_IMAGE_TEMPLATE_NAME,
  WA_INVOICE_TEMPLATE_NAME,
} = process.env;

const API_URL = `https://graph.facebook.com/v17.0/${WA_PHONE_NUMBER_ID}/messages`;

// Send a text-based template message
async function sendTemplateMessage(to, fullName, dueMessage) {
  try {
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: WA_TEMPLATE_NAME,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: fullName },
              { type: "text", text: dueMessage },
            ],
          },
        ],
      },
    };

    const response = await axios.post(API_URL, body, {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ WhatsApp template sent to ${to}`);
    return response.data;
  } catch (err) {
    console.error(
      `❌ Failed to send template message to ${to}`,
      err.response?.data || err.message
    );
    throw err;
  }
}

// Send image using approved template
async function sendImageTemplateMessage(to, imageUrl) {
  try {
    if (!WA_IMAGE_TEMPLATE_NAME) {
      throw new Error("WA_IMAGE_TEMPLATE_NAME is not set in .env");
    }

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: WA_IMAGE_TEMPLATE_NAME,
        language: { code: "en" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: imageUrl,
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [], // Add dynamic text if needed
          },
        ],
      },
    };

    const response = await axios.post(API_URL, body, {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ WhatsApp image template sent to ${to}`);
    return response.data;
  } catch (err) {
    console.error(
      `❌ Failed to send WhatsApp image template to ${to}`,
      err.response?.data || err.message
    );
    throw err;
  }
}

// Send invoice PDF via document-type template
async function sendInvoiceTemplate(
  phoneNumber,
  firstName,
  lastName,
  invoiceNumber,
  invoiceAmount,
  pdfUrl
) {
  const payload = {
    messaging_product: "whatsapp",
    to: phoneNumber.replace("+", ""),
    type: "template",
    template: {
      name: WA_INVOICE_TEMPLATE_NAME,
      language: {
        code: "en", //
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: pdfUrl,
                filename: `Invoice_${invoiceNumber}.pdf`,
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: `${firstName} ${lastName}` },
            { type: "text", text: invoiceNumber },
            { type: "text", text: invoiceAmount.toString() },
          ],
        },
      ],
    },
  };

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (err) {
    console.error(
      "❌ Error sending invoice template:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  sendTemplateMessage,
  sendImageTemplateMessage,
  sendInvoiceTemplate,
};
