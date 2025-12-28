import { Resolver, Query } from "@nestjs/graphql";


@Resolver()
export class SettingGraphqlResolver {

  @Query(() => String)
  health() : string {
    return "graphql 체크 완료"
  };

};