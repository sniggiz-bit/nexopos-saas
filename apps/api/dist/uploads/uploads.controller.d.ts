export declare class UploadsController {
    uploadImage(file: Express.Multer.File): {
        url: string;
        filename: string;
        size: number;
    };
}
