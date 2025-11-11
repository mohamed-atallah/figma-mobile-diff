"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv = __importStar(require("dotenv"));
const comparison_routes_1 = __importDefault(require("./api/routes/comparison.routes"));
// Load environment variables
dotenv.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/storage', express_1.default.static(path_1.default.join(__dirname, '../storage')));
// API Routes
app.use('/api/comparisons', comparison_routes_1.default);
// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'index.html'));
});
app.get('/results/:id', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'results.html'));
});
app.get('/history', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public', 'history.html'));
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});
// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Mobile Visual Regression Testing Server');
    console.log('='.repeat(60));
    console.log(`📍 Server running at: http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔍 API endpoint: http://${HOST}:${PORT}/api/comparisons`);
    console.log('='.repeat(60));
    console.log('Ready to accept image comparisons! 🎉');
    console.log('');
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=server.js.map