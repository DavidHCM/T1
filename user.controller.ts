import { Request, Response } from 'express';
import User from './../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { HTTP_STATUS } from '../types/http-status-codes';
import { User as UserType } from '../types/user';
const secretKey = process.env.JWT_SECRET;
 
// Cambio 2 - Cambios desde git 2  - cambio de rama 1

class userController {
    async getAll(req: Request, res: Response) {
        try {
            const results = await User.find({});
            res.send(results);
        } catch (err) {
            res.status(HTTP_STATUS.NOT_FOUND).send({ message: 'No users found' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const existingUser = await User.findOne({ userId });
            if (!existingUser) {
                throw ('User does not exist: ' + HTTP_STATUS.NOT_FOUND);
            }
            res.send(existingUser);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.NOT_FOUND;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error fetching user';

            res.status(status).send({ message, error: err });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const updatedData = req.body;

            const existingUser = await User.findOne({ userId });

            if (!existingUser) {
                throw ('User does not exist: ' + HTTP_STATUS.CONFLICT);
            }

            const updatedUser = await User.findOneAndUpdate(
                { userId },
                updatedData,
                { new: true, runValidators: true }
            );

            res.status(HTTP_STATUS.SUCCESS).json(updatedUser);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error updating user';

            res.status(status).send({ message, error: err });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const userId = req.params.userId;
            const existingUser = await User.findOne({ userId });

            if (!existingUser) {
                throw ('User does not exist: ' + HTTP_STATUS.CONFLICT);
            }

            const deletedUser = await User.deleteOne({ userId });
            res.status(HTTP_STATUS.SUCCESS).json(deletedUser);
        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error deleting user';

            res.status(status).send({ message, error: err });
        }
    }

    async register(req: Request, res: Response) {
        try {
            const { name, email, password, role, status }: UserType = req.body;
            if (!name || !email || !password || !role) {
                throw 'Missing required fields: ' + HTTP_STATUS.BAD_REQUEST;
            }

            const existingUser = await User.findOne({email});
            if(existingUser){
                throw 'User already exists: ' + HTTP_STATUS.CONFLICT;
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newStatus = status || 'new';
            const userId = uuidv4();
            const createdAt = new Date().toISOString();

            const newUser = new User({
                userId,
                name,
                email,
                password: hashedPassword,
                role,
                status: newStatus,
                createdAt
            });

            await newUser.save();

            res.status(HTTP_STATUS.SUCCESS).send({message: 'User registered successfully'});

        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error registering user';

            res.status(status).send({ message, error: err });
        }
    };

    async login(req: Request, res: Response) {
        try {
            const { email, password }: UserType = req.body;
            if (!email || !password) {
                throw 'Missing required fields: ' + HTTP_STATUS.BAD_REQUEST;
            }

            const expectedUser = await User.findOne({ email });
            if (!expectedUser) {
                throw 'User not found: ' + HTTP_STATUS.NOT_FOUND;
            }

            const forbiddenStatuses = ['inactive', 'deleted', 'archived'];
            if (forbiddenStatuses.includes(expectedUser.status || '')) {
                throw 'User account is not active: ' + HTTP_STATUS.AUTH_ERROR;
            }

            const isPasswordValid = await bcrypt.compare(password, expectedUser.password);
            if (!isPasswordValid) {
                throw 'Invalid credentials: ' + HTTP_STATUS.AUTH_ERROR;
            }
            // TODO: Revisar si en el sign del token meteriamos la password aunque este hasheada: password: expectedUser.password
            const token = jwt.sign({ email: expectedUser.email ,role: expectedUser.role}, secretKey as string);

            res.status(HTTP_STATUS.SUCCESS).send({ token, message: 'Login successful' });

        } catch (err) {
            const status = err instanceof Error && 'status' in err ? (err as any).status : HTTP_STATUS.BAD_REQUEST;
            const message = err instanceof Error && 'message' in err ? err.message : 'Error logging in user';

            res.status(status).send({ message, error: err });
        }
    };
}

export const userControllers = new userController();
