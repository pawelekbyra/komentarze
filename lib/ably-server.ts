export const ably = {
    channels: {
        get: (channel: string) => ({
            publish: async (name: string, data: any) => {},
            subscribe: (name: string, callback: any) => {},
            unsubscribe: (name: string, callback: any) => {},
        })
    }
};
