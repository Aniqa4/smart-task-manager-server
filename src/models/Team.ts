import { Schema, model, Document, Types } from 'mongoose';

export interface IMember {
  _id: Types.ObjectId;
  name: string;
  role?: string;
  capacity: number;
}

export interface ITeam extends Document {
  name: string;
  owner: Types.ObjectId;
  members: IMember[];
}

const memberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
    role: { type: String },
    capacity: { type: Number, default: 0, min: 0, max: 5 }
  },
  { _id: true }
);

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] }
  },
  { timestamps: true }
);

export default model<ITeam>('Team', teamSchema);
