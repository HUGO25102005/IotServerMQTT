import { Request, Response } from "express";
export declare const locksController: {
    getAll(_req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    lock(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    unlock(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getCommandStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getEvents(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=locks.controller.d.ts.map