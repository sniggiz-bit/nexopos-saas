export declare class EmailService {
    private readonly logger;
    private readonly resendApiKey;
    private readonly fromEmail;
    sendWelcomeEmail(email: string, name: string, credentials: {
        email: string;
        password: string;
        companyName: string;
    }): Promise<void>;
    private generateWelcomeEmailHtml;
}
