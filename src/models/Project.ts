import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  team: Types.ObjectId;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }
  },
  { timestamps: true }
);

export default model<IProject>('Project', projectSchema);
