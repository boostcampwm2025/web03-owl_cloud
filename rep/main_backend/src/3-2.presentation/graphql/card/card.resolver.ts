import { Resolver, ResolveField, Parent, Query, Args, ID, Mutation } from "@nestjs/graphql";
import { Card, CardItem, DeleteCardItemInput, UpdateCardItemOutput, UpdateCardItemInput, DeleteCardItemOuput, UpdateCardOutput, UpdateCardInput, DeleteCardOutput, DeleteCardInput } from "./card.types";
import { CardGraphqlService } from "./card.service";


@Resolver(() => Card)
export class CardGraphqlResover {

  constructor(
    private readonly cardService : CardGraphqlService,
  ) {};

  @Query(() => Card, { name : "card" }) // card_id를 대입할 수 있고 그걸 Args로 받는다. 
  async card(@Args("card_id", { type : () => ID }) card_id : string) : Promise<Card> {
    return this.cardService.cardService(card_id);
  };

  // 모든 카드를 다 가져오는 로직
  @ResolveField(() => [CardItem], { name : "card_items" })
  async cardItems(@Parent() card : Card) : Promise<CardItem[]> {
    return this.cardService.cardItemService(card.card_id);
  }

  // 카드 자체에 대한 업데이트와 삭제 부분을 추가 해야 한다. 
  @Mutation(() => UpdateCardOutput, { name : "update_card" })
  async updateCard(
    @Args("input", { type : () => UpdateCardInput }) input : UpdateCardInput
  ) {
    
  }

  // 카드를 삭제하는 부분 
  @Mutation(() => DeleteCardOutput, { name : "delete_card" })
  async deleteCard(
    @Args("input", { type : () => DeleteCardInput }) input : DeleteCardInput
  ) {
    
  }

  // 카드에 아이템을 수정하는 로직 -> 여러개를 수정할 수 있게 하자 ( 하나만 해도 괜찮다. ) 
  // 만약 데이터중 하나라도 오염된게 있다면 이는 수정하면 안되는 부분인 것이다 따라서 하나의 오류는 업데이트가 안되는 걸로 처리할 예정이다. 
  @Mutation(() => UpdateCardItemOutput, { name : "update_card_items" })
  async updateCardItems(
    @Args("inputs", { type: () => [UpdateCardItemInput] } ) inputs : UpdateCardItemInput[]
  ) : Promise<UpdateCardItemOutput> {
    return this.cardService.updateCardItemsService(inputs);
  }

  // 카드에 아이템을 삭제하는 로직
  @Mutation(() => DeleteCardItemOuput, { name : "delete_card_items" })
  async deleteCardItems(
    @Args("inputs", { type: () => DeleteCardItemInput  }) inputs : DeleteCardItemInput
  ) : Promise<DeleteCardItemOuput> {
    return this.cardService.deleteCardItemsService(inputs);
  } 

};