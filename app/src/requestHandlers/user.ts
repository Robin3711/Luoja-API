import { Request, Response } from "express";
import { assert, string } from "superstruct";
import { prisma } from "../model/db";
import { hash } from "bcrypt";

const CreateUserSchema = {
    email: string(),
    password: string()
};

export async function createUser(req: Request, res: Response) {
    try {
        const email = req.body.email;
        const password = req.body.password;

        assert(email, string());
        assert(password, string());

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword
            }
        });

        res.status(200).json({user: user});
    }
    catch (error: any) {
        res.status(400).json({error: error.message});
    }
}