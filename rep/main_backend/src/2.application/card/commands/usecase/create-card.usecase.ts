import { IdGenerator } from "@domain/shared";
import { CreateCardDto } from "@app/card/commands/dto";
import { InsertValueToDb } from "@app/ports/db/db.outbound";
import { CardAggregate } from "@domain/card/card.aggregate";
import { CardProps, CardStateProps } from "@domain/card/vo";
import { NotCreateCardStateError } from "@error/application/card/card.error";
import { Injectable } from "@nestjs/common";


export type InsertCardAndCardStateDataProps = {
  card : Required<CardProps>;
  cardState : CardStateProps;
};

type CreateCardUsecaseProps<T> = {
  cardIdGenrator : IdGenerator;
  insertCardAndCardStateToDb : InsertValueToDb<T>;
};

// card를 생성할 때 사용하는 usecase
@Injectable()
export class CreateCardUsecase<T> {
  private readonly cardIdGenrator : CreateCardUsecaseProps<T>["cardIdGenrator"];
  private readonly insertCardAndCardStateToDb : CreateCardUsecaseProps<T>["insertCardAndCardStateToDb"];
  
  constructor({
    cardIdGenrator, insertCardAndCardStateToDb
  } : CreateCardUsecaseProps<T>) {
    this.cardIdGenrator = cardIdGenrator;
    this.insertCardAndCardStateToDb = insertCardAndCardStateToDb;
  }

  async execute( dto : CreateCardDto ) : Promise<string> {

    // 1. 정합성 파악 
    const cardAggregate = CardAggregate.createCard({ 
      input : {
        user_id : dto.user_id,
        category_id : dto.category_id,
        thumbnail_path : undefined,
        status : "draft",
        title : dto.title,
        workspace_width : dto.workspace_width,
        workspace_height : dto.workspace_height,
        background_color : dto.background_color
      },
      cardIdGenerator : this.cardIdGenrator
     });

    // 2. 데이터 저장 ( card + card_stat )
    const card : Required<CardProps> = cardAggregate.getCard().getData();
    const cardState : CardStateProps | undefined = cardAggregate.getCardState()?.getData();
    if ( !cardState ) throw new NotCreateCardStateError();
    const insertCardAndCardStateData : InsertCardAndCardStateDataProps = {
      card, cardState
    };
    const insertChecked : boolean = await this.insertCardAndCardStateToDb.insert(insertCardAndCardStateData);
    if ( !insertChecked ) throw new NotCreateCardStateError();

    // 추후 cache를 추가하는게 좋아 보이기는 한다. 

    // 3. card_id 반환
    return cardAggregate.getCard().getCardId();
  };

};