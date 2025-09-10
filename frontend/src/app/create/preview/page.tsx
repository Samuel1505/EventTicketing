"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import {contractAddress, contractABI } from "../../../contractAddressandAbi"
import { ThirdwebStorage } from "@thirdweb-dev/storage"

interface EventFormData {
  eventName: string
  eventDescription: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  expectedAttendees: string
  bannerPreview: string | null 
}

export default function PreviewEventPage() {
  const router = useRouter()
  const [eventData, setEventData] = useState<EventFormData | null>(null)
  const [ticketType, setTicketType] = useState("free")
  const [regularPrice, setRegularPrice] = useState("")
  const [vipPrice, setVipPrice] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)

  // Initialize thirdweb storage with Client ID (replace with your actual ID from thirdweb dashboard)
  const CLIENT_ID = "edfebecb8105216e28982922a03a5064" // Get from https://thirdweb.com/dashboard/settings/api-keys
  const storage = new ThirdwebStorage({ clientId: CLIENT_ID })

  useEffect(() => {
    const storedData = localStorage.getItem("eventFormData")
    if (storedData) {
      const parsedData = JSON.parse(storedData)
      setEventData(parsedData)
    } else {
      router.push("/create")
    }
  }, [router])

  // Helper to select provider (resolves MetaMask/Coinbase conflict)
  const getEthereumProvider = () => {
    if (!window.ethereum) {
      throw new Error("No wallet extension detected. Please install MetaMask or another Web3 wallet.")
    }

    let ethereum = window.ethereum
    if (Array.isArray(window.ethereum.providers)) {
      const metaMaskProvider = window.ethereum.providers.find((provider: any) => provider.isMetaMask)
      if (metaMaskProvider) {
        ethereum = metaMaskProvider
        if (window.ethereum.setSelectedProvider) {
          window.ethereum.setSelectedProvider(metaMaskProvider)
        }
      } else {
        ethereum = window.ethereum.providers[0]
      }
    }
    return ethereum
  }

  // Check wallet connection
  const checkWalletConnection = async () => {
    const ethereum = getEthereumProvider()
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    if (accounts.length === 0) {
      await ethereum.request({ method: 'eth_requestAccounts' })
    }
    return accounts
  }

  // Switch to Somnia Testnet (chain ID: 0xc488)
  const checkAndSwitchNetwork = async () => {
    const ethereum = getEthereumProvider()
    try {
      const chainId = await ethereum.request({ method: 'eth_chainId' })
      const somniaTestnetChainId = '0xc488'

      if (chainId !== somniaTestnetChainId) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: somniaTestnetChainId }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: somniaTestnetChainId,
                chainName: 'Somnia Shannon Testnet',
                nativeCurrency: { name: 'Somnia Testnet Token', symbol: 'STT', decimals: 18 },
                rpcUrls: ['https://testnet-rpc.somnia.network'],
                blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
              }],
            })
          } else {
            throw switchError
          }
        }
      }
    } catch (error) {
      console.warn('Network switch failed:', error)
      alert('Failed to switch to Somnia Testnet. Please add it manually in your wallet and claim STT tokens.')
    }
  }

  const handlePublish = async () => {
    if (!eventData) return

    setIsPublishing(true)

    try {
      console.log('Checking wallet connection...')
      const accounts = await checkWalletConnection()
      await checkAndSwitchNetwork()

      const ethereum = getEthereumProvider()
      console.log('Creating provider...')
      const provider = new ethers.providers.Web3Provider(ethereum)
      console.log('Getting signer...')
      const signer = await provider.getSigner()
      console.log('Creating contract instance...')
      const contract = new ethers.Contract(contractAddress, contractABI, signer)

      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`)
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`)
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date/time format")
      }

      const startTimestamp = Math.floor(startDateTime.getTime() / 1000 ) + 86400;
      const endTimestamp = Math.floor(endDateTime.getTime() / 1000)
      const expected = parseInt(eventData.expectedAttendees)
      
      if (isNaN(expected) || expected <= 0) {
        throw new Error("Invalid expected attendees number")
      }

      const isPaid = ticketType === "paid"

      if (isPaid && (!regularPrice || !vipPrice)) {
        throw new Error("Both regular and VIP prices are required for paid events")
      }

      // Upload banner to IPFS (improved base64 handling)
      let bannerCID = ""
      if (eventData.bannerPreview) {
        console.log('Uploading base64 banner to IPFS...')
        try {
          // Convert base64 to Blob/File (reliable for data URLs)
          const base64Data = eventData.bannerPreview.split(',')[1] // Remove 'data:image/...;base64,' prefix
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: 'image/jpeg' }) // Adjust type if needed (e.g., 'image/png')
          const file = new File([blob], "event-banner.jpg", { type: 'image/jpeg' })

          const uploadResult = await storage.upload(file)
          bannerCID = storage.resolveScheme(uploadResult) // e.g., 'ipfs://Qm...'
          console.log('Banner uploaded to IPFS with CID:', bannerCID)
        } catch (uploadError) {
          console.error('IPFS upload failed:', uploadError)
          const errorMessage = typeof uploadError === "object" && uploadError !== null && "message" in uploadError
            ? (uploadError as { message: string }).message
            : String(uploadError)
          throw new Error(`Failed to upload banner to IPFS: ${errorMessage}`)
        }
      } else {
        // Optional: Allow publishing without banner
        bannerCID = ""
        console.log('No banner provided, skipping IPFS upload')
      }

      console.log('Creating event transaction with params:', {
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        location: eventData.location,
        startTimestamp,
        endTimestamp,
        expected,
        isPaid,
        bannerCID
      })
      const createEventTx = await contract.createEvent(
        eventData.eventName,
        eventData.eventDescription,
        eventData.location,
        startTimestamp,
        endTimestamp,
        expected,
        isPaid,
        bannerCID,
        { value: 0, gasLimit: 500000 }
      )

      console.log('Waiting for transaction confirmation. Tx hash:', createEventTx.hash)
      const receipt = await createEventTx.wait()
      
      if (!receipt) {
        throw new Error("Transaction failed - no receipt received")
      }

      console.log('Transaction receipt:', JSON.stringify(receipt, null, 2))

      console.log('Parsing event ID from logs...')
      const eventInterface = new ethers.Interface(contractABI)
      let eventId
      for (const log of receipt.logs) {
        try {
          console.log('Parsing log:', log)
          const parsed = eventInterface.parseLog({
            topics: log.topics,
            data: log.data
          })
          if (parsed?.name === "EventOrganized") {
            eventId = parsed.args.eventId
            console.log('Found EventOrganized with eventId:', eventId.toString())
            break
          }
        } catch (parseError) {
          console.warn('Failed to parse log:', parseError)
          continue
        }
      }

      if (!eventId) {
        throw new Error("Failed to extract event ID from transaction logs. Check contract deployment and ABI.")
      }

      console.log('Event created with ID:', eventId.toString())

      console.log('Creating tickets...')
      if (isPaid) {
        const regularWei = ethers.utils.parseEther(regularPrice)
        const vipWei = ethers.utils.parseEther(vipPrice)
        
        console.log('Creating regular ticket...')
        const regularTicketTx = await contract.createTicket(eventId, 1, regularWei, { value: 0, gasLimit: 1000000 })
        await regularTicketTx.wait()
        
        console.log('Creating VIP ticket...')
        const vipTicketTx = await contract.createTicket(eventId, 2, vipWei, { value: 0, gasLimit: 1000000 })
        await vipTicketTx.wait()
      } else {
        console.log('Creating free ticket...')
        const freeTicketTx = await contract.createTicket(eventId, 0, BigInt(0), { value: 0, gasLimit: 1000000 })
        await freeTicketTx.wait()
      }

      localStorage.removeItem("eventFormData")
      alert("Event published successfully! Gas fees paid in STT (free testnet tokens).")
      router.push("/dashboard")

    } catch (error: any) {
      console.error('Publish error:', error)
      let errorMessage = "Failed to publish event"
      if (error.message?.includes("User denied")) {
        errorMessage = "Transaction was cancelled by user"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient STT tokens. Please claim more from the Somnia Testnet faucet at https://testnet.somnia.network."
      } else if (error.message?.includes("No wallet")) {
        errorMessage = "Please install and connect a Web3 wallet (like MetaMask)"
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error - please ensure you're on the Somnia Testnet"
      } else if (error.reason) {
        errorMessage = `Transaction failed: ${error.reason}`
      } else if (error.message) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (!eventData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading event preview...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Event Preview</h1>
            <p className="text-muted-foreground">
              Review your event details and set ticket pricing. Publishing requires STT tokens from the Somnia Testnet faucet (free).
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <a href="https://testnet.somnia.network" target="_blank" rel="noopener noreferrer" className="underline">
                Claim STT tokens here
              </a> to cover gas fees.
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                const ethereum = getEthereumProvider()
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xc488',
                    chainName: 'Somnia Shannon Testnet',
                    nativeCurrency: { name: 'Somnia Testnet Token', symbol: 'STT', decimals: 18 },
                    rpcUrls: ['https://testnet-rpc.somnia.network'],
                    blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
                  }],
                })
              }}
              className="mt-2"
            >
              Add Somnia Testnet to Wallet
            </Button>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                {eventData.bannerPreview && (
                  <img
                    src={eventData.bannerPreview || "/placeholder.svg"}
                    alt="Event banner"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h2 className="text-2xl font-bold mb-2">{eventData.eventName}</h2>
                <p className="text-muted-foreground mb-4">{eventData.eventDescription}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                    </svg>
                    <div>
                      <p className="font-medium">Start: {formatDate(eventData.startDate)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(eventData.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                    </svg>
                    <div>
                      <p className="font-medium">End: {formatDate(eventData.endDate)}</p>
                      <p className="text-sm text-muted-foreground">{formatTime(eventData.endTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-medium">{eventData.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <p className="font-medium">Expected Attendees: {eventData.expectedAttendees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ticket Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={ticketType} onValueChange={setTicketType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free" className="flex-1">
                      <div>
                        <p className="font-medium">Free Event</p>
                        <p className="text-sm text-muted-foreground">No charge for attendees</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="flex-1">
                      <div>
                        <p className="font-medium">Paid Event</p>
                        <p className="text-sm text-muted-foreground">Set prices for different ticket types</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {ticketType === "paid" && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary">
                    <div className="space-y-2">
                      <Label htmlFor="regularPrice">Regular Ticket Price (STT)</Label>
                      <Input
                        id="regularPrice"
                        placeholder="0.05"
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        type="number"
                        step="0.001"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vipPrice">VIP Ticket Price (STT)</Label>
                      <Input
                        id="vipPrice"
                        placeholder="0.1"
                        value={vipPrice}
                        onChange={(e) => setVipPrice(e.target.value)}
                        type="number"
                        step="0.001"
                        min="0"
                      />
                    </div>
                  </div>
                )}
                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={handlePublish} 
                    className="w-full" 
                    size="lg"
                    disabled={isPublishing}
                  >
                    {isPublishing ? "Publishing..." : "Publish Event"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/create")} 
                    className="w-full"
                    disabled={isPublishing}
                  >
                    Back to Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}