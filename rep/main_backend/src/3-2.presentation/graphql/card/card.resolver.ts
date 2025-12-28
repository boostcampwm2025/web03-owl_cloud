import { Resolver, ResolveField, Parent, Query, Args, ID } from "@nestjs/graphql";
import { Card, CardItem } from "./card.types";
import { CardGraphqlService } from "./card.service";


@Resolver(() => Card)
export class CardGraphqlResover {

  constructor(
    private readonly cardService : CardGraphqlService,
  ) {};

  @Query(() => Card, { name : "card" }) // card_id를 대입할 수 있고 그걸 Args로 받는다. 
  async card(@Args("card_id", { type : () => ID }) card_id : string) {
    
  };

  // 모든 카드를 다 가져오는 로직
  @ResolveField(() => [CardItem], { name : "card_items" })
  async cardItems(@Parent() card : Card) {
    
  }

  // 카드에 아이템을 수정하는 로직 


  // 카드에 아이템을 삭제하는 로직

};