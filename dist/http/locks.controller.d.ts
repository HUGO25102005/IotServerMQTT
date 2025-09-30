import { Request, Response } from "express";
export declare const locksController: {
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    lock(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    unlock(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCommandStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getEvents(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=locks.controller.d.ts.map