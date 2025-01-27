import { Request, Response } from 'express';
import Notification from './../models/notification.model';
import { HTTP_STATUS } from '../types/http-status-codes';
import { Notification as NotificationType } from '../types/notification';

class notificationController {
    async create(req: Request, res: Response) {
        try {
            const {
                notificationId,
                userId,
                deliveryId,
                message,
                type,
                status,
                createdAt
            }: NotificationType = req.body;

            const existingNotification = await Notification.findOne({ notificationId });

            if (existingNotification) {
                throw ('Notification already exists: ' + HTTP_STATUS.CONFLICT);
            }

            const newNotification = new Notification({
                notificationId,
                userId,
                deliveryId,
                message,
                type,
                status,
                createdAt
            });

            const savedNotification = await newNotification.save();
            res.status(HTTP_STATUS.SUCCESS).json(savedNotification);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error creating notification';

            res.status(status).send({ message, error: err });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const results = await Notification.find({});
            res.send(results);
        } catch (err) {
            res.status(HTTP_STATUS.NOT_FOUND).send({ message: 'No notifications found' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const notificationId = req.params.notificationId;
            const existingNotification = await Notification.findOne({ notificationId });
            if (!existingNotification) {
                throw ('Notification does not exist: ' + HTTP_STATUS.NOT_FOUND);
            }
            res.send(existingNotification);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.NOT_FOUND;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error fetching notification';

            res.status(status).send({ message, error: err });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const notificationId = req.params.notificationId;
            const updatedData = req.body;

            const existingNotification = await Notification.findOne({ notificationId });

            if (!existingNotification) {
                throw ('Notification does not exist: ' + HTTP_STATUS.CONFLICT);
            }

            const updatedNotification = await Notification.findOneAndUpdate(
                { notificationId },
                updatedData,
                { new: true, runValidators: true }
            );

            res.status(HTTP_STATUS.SUCCESS).json(updatedNotification);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error updating notification';

            res.status(status).send({ message, error: err });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const notificationId = req.params.notificationId;
            const existingNotification = await Notification.findOne({ notificationId });

            if (!existingNotification) {
                throw ('Notification does not exist: ' + HTTP_STATUS.CONFLICT);
            }

            const deletedNotification = await Notification.deleteOne({ notificationId });
            res.status(HTTP_STATUS.SUCCESS).json(deletedNotification);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error deleting notification';

            res.status(status).send({ message, error: err });
        }
    }
}

export const notificationControllers = new notificationController();
