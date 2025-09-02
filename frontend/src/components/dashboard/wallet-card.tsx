"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WalletCard() {
  // Mock wallet data - in real app this would come from wallet connection
  const walletAddress = "0x1234...5678"
  const tokenBalance = "1,250.50"
  const isConnected = true

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Wallet Status</span>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm">{walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SOMIA Token Balance</p>
                <p className="text-2xl font-bold">{tokenBalance} SOMIA</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              <Button variant="destructive" size="sm">
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No wallet connected</p>
            <Button>Connect Wallet</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
