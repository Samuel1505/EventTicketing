"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatEther } from 'viem'
import { useEffect, useState } from 'react'

export function WalletCard() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  })

  // Format the wallet address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format the balance for display
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return "0.00"
    const formatted = formatEther(balance)
    return parseFloat(formatted).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })
  }

  // Custom disconnect handler
  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Wallet Status</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm">{address ? formatAddress(address) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {chain?.nativeCurrency?.symbol || 'STT'} Balance
                </p>
                <p className="text-2xl font-bold">
                  {balanceLoading 
                    ? "Loading..." 
                    : `${formatBalance(balance?.value)} ${balance?.symbol || 'STT'}`
                  }
                </p>
              </div>
              {chain && (
                <div>
                  <p className="text-sm text-muted-foreground">Network</p>
                  <p className="text-sm font-medium">{chain.name}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={chain?.blockExplorers?.default?.url ? `${chain.blockExplorers.default.url}/address/${address}` : '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Details
                </a>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div> 
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No wallet connected</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}