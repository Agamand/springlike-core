import { Config } from "./ConfigMgr";
import http from 'http';

export class HttpServer {

    private static instance: HttpServer = null;

    static getInstance() {
        if (null === HttpServer.instance) {
            HttpServer.instance = new HttpServer();
        }
        return HttpServer.instance;
    }


    private isStarted: boolean = false;
    private server: http.Server = null;
    private listener: http.RequestListener;
    @Config(['http.host', 'rest.host'], 'localhost')
    public host: string;
    @Config(['http.port', 'rest.port'], 3010)
    public port: number;
    @Config(['http.protocol', 'rest.protocol'], 'http')
    public protocol: string;
    @Config(['http.publicPort', 'rest.publicPort'])
    public publicPort: number
    @Config(['http.publicAddress', 'rest.publicAddress'])
    public publicAddress: string

    private constructor() { }

    isStart() {
        return this.isStarted;
    }
    start() {
        this.server = http.createServer(function (req, res) {
            if (this.listener)
                this.listener(req, res);
        });
        this.server.listen(this.port);
        this.isStarted = true;
    }
    setRequestListener(listener: http.RequestListener) {
        this.listener = listener;
    }
    getServer() {
        return this.server;
    }
}