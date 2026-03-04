import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    room_id: string; // Refers to Postgres_Rooms.id (UUID string)
    author_id: string; // Refers to Postgres_Users.id (UUID string)
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema: Schema = new Schema(
    {
        room_id: { type: String, required: true },
        author_id: { type: String, required: true },
        content: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export const Message = mongoose.model<IMessage>('Message', messageSchema);
