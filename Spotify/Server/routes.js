export default function ServerRoutes(app) {
    const serverStatus = async (req, res) => {
        res.status(200).json({ status: 'Server is live' });
    };

    app.get('/health', serverStatus);
}
