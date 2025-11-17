import { Schema, model, Document, Types } from 'mongoose';

export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Pending' | 'In Progress' | 'Done';

export interface ITask extends Document {
  project: Types.ObjectId;
  title: string;
  description?: string;
  assignedMember?: Types.ObjectId | null;
  priority: Priority;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String },
    assignedMember: { type: Schema.Types.ObjectId },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Done'], default: 'Pending' }
  },
  { timestamps: true }
);

export default model<ITask>('Task', taskSchema);
