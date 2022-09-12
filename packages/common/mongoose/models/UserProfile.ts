import { mongoose } from "../index";

const userProfileSchema = new mongoose.Schema(
  {
    _id: Number, // user_id
    headline: String,
    readme: String,
  },
  { timestamps: true }
);

export const UserProfile =
  mongoose.models.UserProfile ||
  mongoose.model("UserProfile", userProfileSchema);
