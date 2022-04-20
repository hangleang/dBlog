import '../styles/globals.css'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { css } from '@emotion/css'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import { AccountContext } from '../context.js'
import 'easymde/dist/easymde.min.css'
import { providerOptions } from '../providerOptions'
import { networkParams } from "../networks"
import { toHex, truncateAddress } from "../utils";
import { ChakraProvider } from "@chakra-ui/react";
import {
  VStack,
  Button,
  Text,
  HStack,
  Select,
  Center,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { Tooltip } from "@chakra-ui/react";

export default function MyApp({ Component, pageProps }) {
  const [web3Modal, setWeb3Modal] = useState()
  const [provider, setProvider] = useState()
  const [library, setLibrary] = useState()
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState()
  const [network, setNetwork] = useState()

  const connect = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions // required
      });
      const provider = await web3Modal.connect()
      const library = new ethers.providers.Web3Provider(provider)
      const accounts = await library.listAccounts()
      const network = await library.getNetwork()
      setWeb3Modal(web3Modal)
      setProvider(provider)
      setLibrary(library)
      setChainId(network.chainId)
      if (accounts) setAccount(accounts[0])
    } catch (err) {
      console.error('error:', err)
    }
  }

  const handleNetwork = (e) => {
    const id = e.target.value
    setNetwork(Number(id))
  }

  const switchNetwork = async () => {
    try {
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: toHex(network) }]
      });
    } catch (err) {
      if (err.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [networkParams[toHex(network)]]
          });
        } catch (error) {
          console.error('error: ', err)
        }
      }
    }
  }

  const disconnect = () => {
    if (!web3Modal) return
    web3Modal.clearCachedProvider();
    refreshState();
  }

  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork("");
  };

  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connect();
    }
  }, []);

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts) => {
        console.log("accountsChanged", accounts);
        if (accounts) setAccount(accounts[0]);
      };

      const handleChainChanged = (_hexChainId) => {
        setChainId(_hexChainId);
      };

      const handleDisconnect = () => {
        disconnect();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        if (provider.removeListener) {
          provider.removeListener("accountsChanged", handleAccountsChanged);
          provider.removeListener("chainChanged", handleChainChanged);
          provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider]);

  return (
    <ChakraProvider>
      <nav className={nav}>
        <HStack justifyContent="space-between" alignItems="center">
          <div className={header}>
            <Link href="/">
              <a><Image
                src='/vercel.svg'
                alt="Vercel Logo"
                width={127}
                height={70}
              /></a>
            </Link>
            <Link href="/">
              <a><VStack alignContent="center">
                <h2 className={title}>Full Stack</h2>
                <p className={description}>WEB3</p>
              </VStack></a>
            </Link>
          </div>
          {
            !account ? (
              <Button onClick={connect}>Connect Wallet</Button>
            ) : (
              <HStack justifyContent="flex-start" alignItems="center">
                <Button onClick={disconnect}>Disconnect</Button>
                <VStack justifyContent="center" alignItems="center" padding="10px 0">
                  <Tooltip label={account} placement="right">
                    <HStack>
                      <Text>{`Account: ${truncateAddress(account)}`}</Text>
                      {account ? (
                        <CheckCircleIcon color="green" />
                      ) : (
                        <WarningIcon color="#cd5700" />
                      )}
                    </HStack>
                  </Tooltip>
                  <Text>{`Network ID: ${chainId ? chainId : "No Network"}`}</Text>
                </VStack>
                <VStack justifyContent="center" alignItems="center" padding="10px 0">
                  <Button onClick={switchNetwork} isDisabled={!network}>Switch Network</Button>
                  <Select placeholder="Select network" onChange={handleNetwork}>
                    <option value="1337">Localhost</option>
                    <option value="137">Polygon</option>
                    <option value="80001">Mumbai</option>
                  </Select>
                </VStack>
              </HStack>
            )
          }
        </HStack>
        <div className={linkContainer}>
          <Link href="/" >
            <a className={link}>
              Home
            </a>
          </Link>
          <Link href="/create-post">
            <a className={link}>
              Create Post
            </a>
          </Link>
        </div>
      </nav>
      <div className={container}>
        <AccountContext.Provider value={account}>
          <Component {...pageProps} connect={connect} />
        </AccountContext.Provider>
      </div>
    </ChakraProvider>
  )
}

const accountInfo = css`
  width: 100%;
  display: flex;
  flex: 1;
  justify-content: flex-end;
  font-size: 12px;
`

const container = css`
  padding: 40px;
`

const linkContainer = css`
  padding: 30px 60px;
  background-color: #fafafa;
`

const nav = css`
  background-color: white;
`

const header = css`
  display: flex;
  border-bottom: 1px solid rgba(0, 0, 0, .075);
  padding: 20px 30px;
`

const description = css`
  margin: 0;
  color: #999999;
`

const titleContainer = css`
  display: flex;
  flex-direction: column;
  padding-left: 15px;
`

const title = css`
  margin-left: 30px;
  font-weight: 500;
  margin: 0;
`

const buttonContainer = css`
  width: 100%;
  display: flex;
  flex: 1;
  justify-content: flex-end;
`

const buttonStyle = css`
  background-color: #fafafa;
  outline: none;
  border: none;
  font-size: 18px;
  padding: 16px 70px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 7px 7px rgba(0, 0, 0, .1);
`

const link = css`
  margin: 0px 40px 0px 0px;
  font-size: 16px;
  font-weight: 400;
`
