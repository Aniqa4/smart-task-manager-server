import { Schema, model, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  team: Types.ObjectId;
  performedBy?: Types.ObjectId;
  task?: Types.ObjectId;
  fromMember?: Types.ObjectId | null;
  toMember?: Types.ObjectId | null;
  message?: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    fromMember: { type: Schema.Types.ObjectId },
    toMember: { type: Schema.Types.ObjectId },
    message: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IActivity>('Activity', activitySchema);
