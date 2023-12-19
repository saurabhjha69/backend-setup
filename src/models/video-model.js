import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoModel = new Schema(
  {
    videoFile: {
      type: String, //cloudnaryy
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    duration: {
      type: Number, // cloudnary
      required: true,
    },
    views: {
      type: Number,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

videoModel.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoModel);
