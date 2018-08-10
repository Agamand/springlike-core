import { suite, test, slow, timeout } from "mocha-typescript";
import chai from 'chai'
import { createClient, PathParam, Path, QueryParam, Body, POST, IParamProvider } from "./index";


@Path('/anything/:a')
class FakeRestApi {

  @PathParam('a')
  a: string

  novalue: string;

  @Path('/:b')
  @POST
  async test(@PathParam('b') b: string, @QueryParam('c') c: string, @Body d): Promise<any> {


  }


}

class toto implements IParamProvider {
  async resolve() {
    return { a: "aFromProvider" };
  }
  getKey() {
    return "TotoResolver"
  }
}





@suite class createClientTest {
  @test
  async testClient(done) {

    let client: FakeRestApi = createClient('http://httpbin.org', FakeRestApi, new toto());
    let data = await client.test('b', 'c', { d: 1 });
    //chai.expect(data.args.c, 'c');
    //chai.expect(data.url, 'http://httpbin.org/anything/aFromProvider/b?c=c')
    done();
  }
}