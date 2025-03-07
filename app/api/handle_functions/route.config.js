// This is the correct way to configure the route in Next.js 13+
export const config = {
    runtime: "nodejs", // Use Node.js instead of Edge for better compatibility
    api: {
        responseLimit: false,
        bodyParser: {
            sizeLimit: "10mb",
        },
    },
};
