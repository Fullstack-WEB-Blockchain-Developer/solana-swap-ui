import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useJupiter } from "@jup-ag/react-hook";
import { ENV as ENVChainId } from "@solana/spl-token-registry";
import FeeInfo from "./FeeInfo";
import { getSPLTokenData, ISplToken } from "../../utils/web3";
import SplTokenList from "../commons/SplTokenList";
import style from "../../styles/jupiter.module.sass";
import { ArrowDownIcon, CloseIcon } from "@chakra-ui/icons";

const CHAIN_ID = ENVChainId.MainnetBeta;
interface IJupiterFormProps {}
interface IToken {
  mint: string;
  symbol: string;
  logoURI: string;
}

type UseJupiterProps = Parameters<typeof useJupiter>[0];

const JupiterForm: FunctionComponent<IJupiterFormProps> = (props) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map());

  const [formValue, setFormValue] = useState<UseJupiterProps>({
    amount: 1,
    inputMint: undefined,
    outputMint: undefined,
    slippage: 1, // 1%
  });

  const [inputTokenInfo, outputTokenInfo] = useMemo(() => {
    return [
      tokenMap.get(formValue.inputMint?.toBase58() || ""),
      tokenMap.get(formValue.outputMint?.toBase58() || ""),
    ];
  }, [formValue.inputMint?.toBase58(), formValue.outputMint?.toBase58()]);
  const [splTokenData, setSplTokenData] = useState<ISplToken[]>([]);

  useEffect(() => {
    new TokenListProvider().resolve().then((tokens) => {
      const tokenList = tokens.filterByChainId(CHAIN_ID).getList();
      setTokenMap(
        tokenList.reduce((map, item) => {
          map.set(item.address, item);
          return map;
        }, new Map())
      );
    });
  }, [setTokenMap]);

  const amountInDecimal = useMemo(() => {
    return formValue.amount * 10 ** (inputTokenInfo?.decimals || 1);
  }, [inputTokenInfo, formValue.amount]);

  const { routeMap, allTokenMints, routes, loading, exchange, error, refresh } =
    useJupiter({
      ...formValue,
      amount: amountInDecimal,
    });

  const validOutputMints = useMemo(() => {
    return routeMap.get(formValue.inputMint?.toBase58() || "") || allTokenMints;
  }, [routeMap, formValue.inputMint?.toBase58()]);

  // ensure outputMint can be swapable to inputMint
  useEffect(() => {
    if (formValue.inputMint) {
      const possibleOutputs = routeMap.get(formValue.inputMint.toBase58());

      if (
        possibleOutputs &&
        !possibleOutputs?.includes(formValue.outputMint?.toBase58() || "")
      ) {
        setFormValue((val) => ({
          ...val,
          outputMint: new PublicKey(possibleOutputs[0]),
        }));
      }
    }
  }, [formValue.inputMint?.toBase58(), formValue.outputMint?.toBase58()]);

  const getSymbolByMint = (mintList: string[]) => {
    return mintList.map((t) => {
      let tokenInfo: IToken = {
        mint: "",
        symbol: "",
        logoURI: "",
      };
      tokenInfo["mint"] = t;
      tokenInfo["symbol"] = tokenMap.get(t)?.name || "unknown";
      tokenInfo["logoURI"] = tokenMap.get(t)?.logoURI || "";
      return tokenInfo;
    });
  };

  const specificTokenOnly = (tokenList: IToken[]): (IToken | undefined)[] => {
    return tokenList.map((t: IToken) => {
      if (
        t.mint === "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" ||
        t.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ||
        t.mint === "So11111111111111111111111111111111111111112" ||
        t.mint === "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" ||
        t.mint === "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"
      ) {
        return t;
      }
    });
  };

  let inputList: IToken[] = specificTokenOnly(
    getSymbolByMint(allTokenMints).sort((a: any, b: any) =>
      a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0
    )
  ).filter((t) => t !== undefined) as IToken[];

  let outputList = specificTokenOnly(
    getSymbolByMint(validOutputMints).sort((a: any, b: any) =>
      a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0
    )
  ).filter((t) => t !== undefined) as IToken[];

  useEffect(() => {
    if (!wallet.connected) {
      return;
    }
    getSPLTokenData(wallet, connection).then((tokenList: ISplToken[]) => {
      if (tokenList) {
        setSplTokenData(() => tokenList.filter((t: any) => t !== undefined));
      }
    });
    return () => {};
  }, [wallet.connected]);

  const [showTokenSelect, setShowTokenSelect] = useState<Boolean>(false);
  const [showOutTokenSelect, setShowOutTokenSelect] = useState<Boolean>(false);

  return (
    <div className={style.jupiterPage}>
      <div>{/* <SplTokenList splTokenData={splTokenData} /> */}</div>
      <div className={style.jupiterFormModal}>
        <div className={style.tokenSelect}>
          <div>From</div>
          <div className={style.inputBlock}>
            <input
              className={style.searchTokenInput}
              name="amount"
              id="amount"
              value={formValue.amount}
              type="text"
              pattern="[0-9]*"
              onInput={(e: any) => {
                let newValue = Number(e.target?.value || 0);
                newValue = Number.isNaN(newValue) ? 0 : newValue;
                setFormValue((val) => ({
                  ...val,
                  amount: Math.max(newValue, 0),
                }));
              }}
            />
            <button onClick={() => setShowTokenSelect(!showTokenSelect)}>
              <span>{inputTokenInfo?.symbol && inputTokenInfo?.symbol}</span>
              <ArrowDownIcon w={20} h={20} />
            </button>
          </div>

          {showTokenSelect && (
            <div
              className={style.overlay}
              onClick={() => setShowTokenSelect(!showTokenSelect)}
            >
              <div
                className={style.tokenContainer}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={style.header}>
                  <div>Select a token</div>
                  <div
                    className={style.closeIcon}
                    onClick={() => setShowTokenSelect(!showTokenSelect)}
                  >
                    <CloseIcon w={20} h={20} />
                  </div>
                </div>
                <div className={style.tokenListTitleRow}>
                  <div>Token name</div>
                </div>
                <div className={style.list}>
                  {inputList.map((t: IToken) => {
                    return (
                      <div
                        key={t.mint}
                        data-mint={t.mint}
                        className={style.tokenRow}
                        onClick={(e) => {
                          const dataMint =
                            e.currentTarget.getAttribute("data-mint") || "";
                          const pbKey = new PublicKey(dataMint);
                          if (pbKey) {
                            setFormValue((val) => ({
                              ...val,
                              inputMint: pbKey,
                            }));
                          }
                          setShowTokenSelect(!showTokenSelect);
                        }}
                      >
                        <div className={style.tokenItem}>
                          <img
                            src={t.logoURI}
                            alt=""
                            className={style.tokenLogo}
                          />
                          <div>{t.symbol}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={style.jupiterFormModal}>
          <div className={style.tokenSelect}>
            <div>To</div>
            <button onClick={() => setShowOutTokenSelect(!showOutTokenSelect)}>
              <span>{outputTokenInfo?.symbol && outputTokenInfo?.symbol}</span>
              <ArrowDownIcon w={20} h={20} />
            </button>
          </div>

          {showOutTokenSelect && (
            <div
              className={style.overlay}
              onClick={() => setShowOutTokenSelect(!showOutTokenSelect)}
            >
              <div
                className={style.tokenContainer}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={style.header}>
                  <div>Select a token</div>
                  <div
                    className={style.closeIcon}
                    onClick={() => setShowOutTokenSelect(!showOutTokenSelect)}
                  >
                    <CloseIcon w={20} h={20} />
                  </div>
                </div>
                <div className={style.tokenListTitleRow}>
                  <div>Token name</div>
                </div>
                <div className={style.list}>
                  {outputList.map((t: IToken) => {
                    return (
                      <div
                        key={t.mint}
                        data-mint={t.mint}
                        className={style.tokenRow}
                        onClick={(e) => {
                          const dataMint =
                            e.currentTarget.getAttribute("data-mint") || "";
                          const pbKey = new PublicKey(dataMint);
                          if (pbKey) {
                            setFormValue((val) => ({
                              ...val,
                              outputMint: pbKey,
                            }));
                          }
                          setShowOutTokenSelect(!showOutTokenSelect);
                        }}
                      >
                        <div className={style.tokenItem}>
                          <img
                            src={t.logoURI}
                            alt=""
                            className={style.tokenLogo}
                          />
                          <div>{t.symbol}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {routes && (
          <div className={style.totalRoutes}>
            {routes?.length} routes found!
          </div>
        )}

        {routes?.[0] &&
          (() => {
            const route = routes[0];
            return (
              <div className={style.routesContainer}>
                <div className={style.bestRouteTag}>Best Route</div>
                <div className={style.routeInfo}>
                  <div>
                    {route.marketInfos.map((info) => info.marketMeta.amm.label)}
                  </div>
                  <div>
                    {route.outAmount / 10 ** (outputTokenInfo?.decimals || 1)}{" "}
                    {outputTokenInfo?.symbol}
                  </div>
                </div>
                <FeeInfo route={route} />
              </div>
            );
          })()}

        {routes?.[1] &&
          (() => {
            const route = routes[1];
            return (
              <div className={style.routesContainer}>
                <div className={style.routeInfo}>
                  <div>
                    {route.marketInfos.map((info) => info.marketMeta.amm.label)}
                  </div>
                  <div>
                    {route.outAmount / 10 ** (outputTokenInfo?.decimals || 1)}{" "}
                    {outputTokenInfo?.symbol}
                  </div>
                </div>
                <FeeInfo route={route} />
              </div>
            );
          })()}

        {error && <div>Error in Jupiter, try changing your input</div>}

        <button
          className={style.operateBtn}
          type="button"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Loading" : "Refresh routes"}
        </button>
        <button
          className={`${style.operateBtn} ${style.swapBtn}`}
          type="button"
          disabled={loading}
          onClick={async () => {
            if (
              !loading &&
              routes?.[0] &&
              wallet.signAllTransactions &&
              wallet.signTransaction &&
              wallet.sendTransaction &&
              wallet.publicKey
            ) {
              console.log("call exchange");
              await exchange({
                wallet: {
                  sendTransaction: wallet.sendTransaction,
                  publicKey: wallet.publicKey,
                  signAllTransactions: wallet.signAllTransactions,
                  signTransaction: wallet.signTransaction,
                },
                route: routes[0],
                confirmationWaiterFactory: async (txid) => {
                  console.log("sending transaction");
                  await connection.confirmTransaction(txid);
                  console.log("confirmed transaction");
                  getSPLTokenData(wallet, connection).then(
                    (tokenList: ISplToken[]) => {
                      if (tokenList) {
                        setSplTokenData(() =>
                          tokenList.filter((t: ISplToken) => t !== undefined)
                        );
                      }
                    }
                  );
                  return await connection.getTransaction(txid, {
                    commitment: "confirmed",
                  });
                },
              });
            }
          }}
        >
          Swap Best Route
        </button>
      </div>
    </div>
  );
};

export default JupiterForm;
