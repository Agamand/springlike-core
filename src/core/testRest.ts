import { GET, Path, PathParam, createClient, QueryParam, POST, Body } from "./RestService";
import { copySync } from "fs-extra";

class Test{


  @GET
  @Path('/test/:id')
  getTest(@PathParam('id') id:string):string{
    return id;
  }
  @GET
  @Path("/v1/universe/ancestries/")
  get_universe_ancestries(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v1/universe/asteroid_belts/:asteroid_belt_id/")
  get_universe_asteroid_belts_asteroid_belt_id(@PathParam("asteroid_belt_id") asteroid_belt_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/bloodlines/")
  get_universe_bloodlines(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v1/universe/categories/")
  get_universe_categories(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/categories/:category_id/")
  get_universe_categories_category_id(@PathParam("category_id") category_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/constellations/")
  get_universe_constellations(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/constellations/:constellation_id/")
  get_universe_constellations_constellation_id(@PathParam("constellation_id") constellation_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/graphics/")
  get_universe_graphics(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/graphics/:graphic_id/")
  get_universe_graphics_graphic_id(@PathParam("graphic_id") graphic_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/groups/")
  get_universe_groups(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string, @QueryParam("page") page?:number):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/groups/:group_id/")
  get_universe_groups_group_id(@PathParam("group_id") group_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @POST
  @Path("/v1/universe/ids/")
  post_universe_ids(@Body names:Array<string>, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/moons/:moon_id/")
  get_universe_moons_moon_id(@PathParam("moon_id") moon_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/planets/:planet_id/")
  get_universe_planets_planet_id(@PathParam("planet_id") planet_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/races/")
  get_universe_races(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v1/universe/regions/")
  get_universe_regions(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/regions/:region_id/")
  get_universe_regions_region_id(@PathParam("region_id") region_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/stargates/:stargate_id/")
  get_universe_stargates_stargate_id(@PathParam("stargate_id") stargate_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/stars/:star_id/")
  get_universe_stars_star_id(@PathParam("star_id") star_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/structures/")
  get_universe_structures(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/structures/:structure_id/")
  get_universe_structures_structure_id(@PathParam("structure_id") structure_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("token") token?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v1/universe/system_jumps/")
  get_universe_system_jumps(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v1/universe/systems/")
  get_universe_systems(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<number>>{return null;}
  @GET
  @Path("/v1/universe/types/")
  get_universe_types(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string, @QueryParam("page") page?:number):Promise<Array<number>>{return null;}
  @GET
  @Path("/v2/universe/factions/")
  get_universe_factions(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<Array<any>>{return null;}
  @POST
  @Path("/v2/universe/names/")
  post_universe_names(@Body ids:Array<number>, @QueryParam("datasource") datasource?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v2/universe/stations/:station_id/")
  get_universe_stations_station_id(@PathParam("station_id") station_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<any>{return null;}
  @GET
  @Path("/v2/universe/system_kills/")
  get_universe_system_kills(@QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("datasource") datasource?:string):Promise<Array<any>>{return null;}
  @GET
  @Path("/v3/universe/systems/:system_id/")
  get_universe_systems_system_id(@PathParam("system_id") system_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}
  @GET
  @Path("/v3/universe/types/:type_id/")
  get_universe_types_type_id(@PathParam("type_id") type_id:number, @QueryParam("If-None-Match") IfNoneMatch?:string, @QueryParam("Accept-Language") AcceptLanguage?:string, @QueryParam("datasource") datasource?:string, @QueryParam("language") language?:string):Promise<any>{return null;}

}

const pathParamMetadataKey = Symbol("rest:pathParam");
const queryParamMetadataKey = Symbol("rest:queryParam");
const bodyMetadataKey = Symbol("rest:body");
const methodMetadataKey = Symbol("rest:method");
const pathMetadataKey = Symbol("rest:path");

const test:Test = createClient('esi.evetech.net',Test);

let result = test.get_universe_constellations();
result.then((data:number[])=>{
  let id = data[0];
  console.log(id,+id);
  return test.get_universe_constellations_constellation_id(id);
}).then((data:any)=>{
  console.log(data);
})