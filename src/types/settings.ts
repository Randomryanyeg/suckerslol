export interface GlobalSettings {
    general: {
        app_url: string;
        webroot_url: string;
        sender_name: string;
        encryption_key: string;
        maintenanceMode: boolean;
        bank_name: string;
        bank_logo: string;
        overdraftLimit: number;
        transferLimit: number;
        dailyLimit: number;
        forceSupportChat: boolean;
        globalEnable: boolean;
        admin_password: string;
        adminPin: string;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        senderName: string;
    };
    telegram: {
        token: string;
        chat_id: string; // Updated from chatId to chat_id for better consistency
        enabled: boolean;
    };
}

export interface User {
    id: string;
    username: string;
    adminPin: string;
    accounts: Record<string, { balance: number; }>;
}
