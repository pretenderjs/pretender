import FakeXMLHttpRequest from "fake-xml-http-request";
import { Params, QueryParams } from "route-recognizer";
type SetupCallback = (this: Server) => void;
interface SetupConfig {
  forcePassthrough: boolean;
}
export type Config = SetupCallback | SetupConfig;
export class Server {
  // HTTP request verbs
  public get: RequestHandler;
  public put: RequestHandler;
  public post: RequestHandler;
  public patch: RequestHandler;
  public delete: RequestHandler;
  public options: RequestHandler;
  public head: RequestHandler;
  constructor(setup?: SetupCallback);

  public shutdown(): void;
}

export type RequestHandler = (
  urlExpression: string,
  response: ResponseHandler,
  async?: boolean
) => void;

export type ResponseData = [number, { [k: string]: string }, string];
interface ExtraRequestData {
  params: Params;
  queryParams: QueryParams;
}
export type ResponseHandler = (
  request: FakeXMLHttpRequest | ExtraRequestData
) => ResponseData | PromiseLike<ResponseData>;

export default Server;
