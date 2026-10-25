const cron = require("node-cron");

const { sendTemplateMessage } = require("../utils/sendSMS");

const { Service } = require("../models");

// Run every day at 9 AM
cron.schedule("0 9 * * *", async () => {
  try {
    // Get today's date
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    // Get all services up to today
    // Populate customer details using customerId reference
    const services = await Service.find({
      serviceDate: {
        $lte: today,
      },
    }).populate(
      "customerId",
      "firstName lastName phoneNumber"
    );

    // If no services found
    if (!services.length) {
      console.log(
        "No upcoming reminders."
      );

      return;
    }

    // Check every service
    for (const service of services) {
      const customer =
        service.customerId;

      // Customer or phone number missing
      if (
        !customer ||
        !customer.phoneNumber
      ) {
        console.warn(
          `Skipping service ${service.id}: missing customer/phone`
        );

        continue;
      }

      // Due date not available
      if (!service.dueDate) {
        console.log(
          `Skipping service ${service.id}: no dueDate set (days was left empty by admin)`
        );

        continue;
      }

      // Normalize due date
      const dueDate =
        new Date(
          service.dueDate
        );

      dueDate.setHours(
        0,
        0,
        0,
        0
      );

      // Current date
      const now =
        new Date();

      now.setHours(
        0,
        0,
        0,
        0
      );

      // Calculate difference in days
      const daysUntilDue =
        Math.round(
          (dueDate - now) /
            (
              1000 *
              60 *
              60 *
              24
            )
        );

      let dueMessage;

      // Reminder 2 days before
      if (
        daysUntilDue === 2
      ) {
        dueMessage =
          "in 2 days";
      }

      // Reminder 1 day before
      else if (
        daysUntilDue === 1
      ) {
        dueMessage =
          "tomorrow";
      }

      // No reminder required
      else {
        continue;
      }

      // Customer full name
      const fullName =
        `${customer.firstName} ${customer.lastName}`.trim();

      // Send WhatsApp reminder
      await sendTemplateMessage(
        customer.phoneNumber,
        fullName,
        dueMessage
      );

      console.log(
        `Reminder sent to ${customer.phoneNumber} (${fullName}): Service due ${dueMessage}`
      );
    }
  } catch (error) {
    console.error(
      "Cron job error:",
      error.response?.data ||
        error.message
    );
  }
});