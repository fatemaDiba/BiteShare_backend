import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send email notification to food donor when their food is requested
 * @param {Object} params - Email parameters
 * @param {string} params.donorEmail - Email of the food donor
 * @param {string} params.donorName - Name of the food donor
 * @param {string} params.foodName - Name of the food item
 * @param {string} params.requesterEmail - Email of the person requesting
 * @param {string} params.requestDate - Date of the request
 * @param {string} params.note - Additional notes from requester
 * @param {number} params.quantity - Quantity of food
 * @param {string} params.location - Pickup location
 */
export const sendFoodRequestNotification = async ({
  donorEmail,
  donorName,
  foodName,
  requesterEmail,
  requestDate,
  note,
  quantity,
  location,
}) => {
  try {
    const mailOptions = {
      from: `"Food Sharing Platform" <${process.env.EMAIL_FROM}>`,
      to: donorEmail,
      subject: `New Food Request - ${foodName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #f59e0b; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🍽️ New Food Request!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${donorName}</strong>,</p>
              <p>Great news! Someone has requested your food donation.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #f59e0b;">Food Details</h3>
                <div class="info-row">
                  <span class="label">Food Item:</span> ${foodName}
                </div>
                <div class="info-row">
                  <span class="label">Quantity:</span> ${quantity}
                </div>
                <div class="info-row">
                  <span class="label">Pickup Location:</span> ${location}
                </div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #f59e0b;">Requester Information</h3>
                <div class="info-row">
                  <span class="label">Email:</span> ${requesterEmail}
                </div>
                <div class="info-row">
                  <span class="label">Request Date:</span> ${requestDate}
                </div>
                ${note
          ? `
                <div class="info-row">
                  <span class="label">Additional Notes:</span><br/>
                  <em style="color: #6b7280;">${note}</em>
                </div>
                `
          : ""
        }
              </div>

              <p style="margin-top: 20px;">
                Please coordinate with the requester to arrange the pickup. You can reach them at 
                <a href="mailto:${requesterEmail}" style="color: #f59e0b;">${requesterEmail}</a>
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for your generosity in sharing food with those in need! 🙏
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from the Food Sharing Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${donorName},

Great news! Someone has requested your food donation.

FOOD DETAILS:
- Food Item: ${foodName}
- Quantity: ${quantity}
- Pickup Location: ${location}

REQUESTER INFORMATION:
- Email: ${requesterEmail}
- Request Date: ${requestDate}
${note ? `- Additional Notes: ${note}` : ""}

Please coordinate with the requester to arrange the pickup.

Thank you for your generosity in sharing food with those in need!

---
This is an automated notification from the Food Sharing Platform
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification to food owner when a bulk order is placed
 * @param {Object} params - Email parameters
 * @param {string} params.ownerEmail - Email of the food owner
 * @param {string} params.ownerName - Name of the food owner
 * @param {string} params.foodName - Name of the food item
 * @param {string} params.customerName - Name of the customer
 * @param {string} params.customerEmail - Email of the customer
 * @param {number} params.quantity - Quantity ordered
 * @param {string} params.deliveryDate - Delivery date
 * @param {string} params.deliveryAddress - Delivery address
 * @param {number} params.totalPrice - Total price
 * @param {string} params.notes - Additional notes
 */
export const sendBulkOrderNotification = async ({
  ownerEmail,
  ownerName,
  foodName,
  customerName,
  customerEmail,
  quantity,
  deliveryDate,
  deliveryAddress,
  totalPrice,
  notes,
}) => {
  try {
    const mailOptions = {
      from: `"Food Sharing Platform" <${process.env.EMAIL_FROM}>`,
      to: ownerEmail,
      subject: `New Bulk Order - ${foodName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10b981; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #10b981; }
            .price { font-size: 24px; color: #10b981; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🛒 New Bulk Order!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${ownerName}</strong>,</p>
              <p>Great news! You have received a new bulk order for your food item.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">Order Details</h3>
                <div class="info-row">
                  <span class="label">Food Item:</span> ${foodName}
                </div>
                <div class="info-row">
                  <span class="label">Quantity:</span> ${quantity} servings
                </div>
                <div class="info-row">
                  <span class="label">Total Price:</span> <span class="price">$${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">Customer Information</h3>
                <div class="info-row">
                  <span class="label">Name:</span> ${customerName}
                </div>
                <div class="info-row">
                  <span class="label">Email:</span> ${customerEmail}
                </div>
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0; color: #10b981;">Delivery Information</h3>
                <div class="info-row">
                  <span class="label">Delivery Date:</span> ${new Date(deliveryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
                </div>
                <div class="info-row">
                  <span class="label">Delivery Address:</span><br/>
                  ${deliveryAddress}
                </div>
                ${notes
          ? `
                <div class="info-row">
                  <span class="label">Customer Notes:</span><br/>
                  <em style="color: #6b7280;">${notes}</em>
                </div>
                `
          : ""
        }
              </div>

              <p style="margin-top: 20px;">
                Please coordinate with the customer to arrange the delivery. You can reach them at 
                <a href="mailto:${customerEmail}" style="color: #10b981;">${customerEmail}</a>
              </p>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using our platform! 🙏
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from the Food Sharing Platform</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${ownerName},

Great news! You have received a new bulk order for your food item.

ORDER DETAILS:
- Food Item: ${foodName}
- Quantity: ${quantity} servings
- Total Price: $${totalPrice.toFixed(2)}

CUSTOMER INFORMATION:
- Name: ${customerName}
- Email: ${customerEmail}

DELIVERY INFORMATION:
- Delivery Date: ${new Date(deliveryDate).toLocaleDateString("en-GB")}
- Delivery Address: ${deliveryAddress}
${notes ? `- Customer Notes: ${notes}` : ""}

Please coordinate with the customer to arrange the delivery.

Thank you for using our platform!

---
This is an automated notification from the Food Sharing Platform
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Bulk order email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending bulk order email:", error);
    return { success: false, error: error.message };
  }
};
