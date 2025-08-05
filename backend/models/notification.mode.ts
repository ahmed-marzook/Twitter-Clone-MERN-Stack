import mongoose, { Schema } from "mongoose";

interface INotification {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  type: "follow" | "like";
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "like"],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
