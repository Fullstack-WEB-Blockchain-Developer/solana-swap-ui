import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@chakra-ui/icons";
import SPLTokenRegistrySource from "../../utils/tokenList";
import { TOKENS } from "../../utils/tokens";
import { ITokenInfo } from ".";
import style from "../../styles/swap.module.sass";
import { ISplToken } from "../../utils/web3";

interface TokenListProps {
  showTokenList: boolean;
  toggleTokenList: (event?: React.MouseEvent<HTMLDivElement>) => void;
  getTokenInfo: Function;
  splTokenData: ISplToken[];
}

const TokenList: FunctionComponent<TokenListProps> = (props) => {
  const [initialList, setList] = useState<ITokenInfo[]>([]);
  const [searchedList, setSearchList] = useState<ITokenInfo[]>([]);
  const searchRef = useRef<any>();
  const [listWithValues, setListWithValues] = useState<ITokenInfo[]>([]);

  useEffect(() => {
    SPLTokenRegistrySource().then((res: any) => {
      let list: ITokenInfo[] = [];
      res.map((item: any) => {
        let token = {} as ITokenInfo;
        if (
          TOKENS[item.symbol] &&
          !list.find(
            (t: ITokenInfo) => t.mintAddress === TOKENS[item.symbol].mintAddress
          )
        ) {
          token = TOKENS[item.symbol];
          token["logoURI"] = item.logoURI;
          list.push(token);
        }
      });
      setList(() => list);
      props.getTokenInfo(
        list.find((item: ITokenInfo) => item.symbol === "SOL")
      );
    });
  }, []);

  useEffect(() => {
    let mappedList: ITokenInfo[] = [];
    if (initialList.length > 0) {
      let sortedNewList: ITokenInfo[] = [];
      mappedList = initialList.map((token: any) => {
        let ownedToken = props.splTokenData.find(
          (t) => t.parsedInfo.mint === token.mintAddress
        );
        return ownedToken ? { ...token, ...ownedToken } : token;
      });

      const ownedTokenList: ITokenInfo[] = mappedList.filter(
        (item: any) => item.amount !== undefined
      );

      const listWithoutOwnedTokens: ITokenInfo[] = mappedList.filter(
        (item: any) => !item.amount
      );

      sortedNewList = [...ownedTokenList, ...listWithoutOwnedTokens];

      setSearchList(sortedNewList);
      setListWithValues(sortedNewList);
    }
  }, [props.splTokenData, initialList]);

  // useEffect(() => {
  //   setSearchList(() => initialList);
  // }, [initialList]);

  const setTokenInfo = (item: ITokenInfo) => {
    props.getTokenInfo(item);
    props.toggleTokenList();
  };

  useEffect(() => {
    if (!props.showTokenList) {
      setSearchList(listWithValues);
      searchRef.current.value = "";
    }
  }, [props.showTokenList]);

  const listItems = (data: ITokenInfo[]) => {
    return data.map((item: ITokenInfo) => {
      return (
        <div
          className={style.tokenRow}
          key={item.mintAddress}
          onClick={() => setTokenInfo(item)}
        >
          <div className={style.tokenItem}>
            <img src={item.logoURI} alt="" className={style.tokenLogo} />
            <div>{item.symbol}</div>
          </div>
          {item.amount && <div>{item.amount}</div>}
        </div>
      );
    });
  };

  const searchToken = (e: any) => {
    let key = e.target.value.toUpperCase();
    let newList: ITokenInfo[] = [];
    listWithValues.map((item: ITokenInfo) => {
      if (item.symbol.includes(key)) {
        newList.push(item);
      }
    });
    setSearchList(() => newList);
  };

  let tokeListComponentStyle;
  if (!props.showTokenList) {
    tokeListComponentStyle = {
      display: "none",
    };
  } else {
    tokeListComponentStyle = {
      display: "block",
    };
  }

  return (
    <div className={style.tokeListComponent} style={tokeListComponentStyle}>
      <div className={style.tokeListContainer}>
        <div className={style.header}>
          <div>Select a token</div>
          <div className={style.closeIcon} onClick={props.toggleTokenList}>
            <CloseIcon w={5} h={5} />
          </div>
        </div>
        <div className={style.inputBlock}>
          <input
            type="text"
            placeholder="Search name or mint address"
            ref={searchRef}
            className={style.searchTokenInput}
            onChange={searchToken}
          />
          <div className={style.tokenListTitleRow}>
            <div>Token name</div>
          </div>
        </div>
        <div className={style.list}>{listItems(searchedList)}</div>
        <div className={style.tokenListSetting}>View Token List</div>
      </div>
    </div>
  );
};

export default TokenList;
