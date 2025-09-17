"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
  useReadContract
} from 'wagmi';
import { parseEther, parseEventLogs } from 'viem';
import { contractAddress, contractABI } from "../../../contractAddressandAbi";
import { ThirdwebStorage } from "@thirdweb-dev/storage";

interface EventFormData {
  eventName: string;
  eventDescription: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  expectedAttendees: string;
  bannerPreview: string | null;
}

// Somnia testnet configuration
const SOMNIA_TESTNET_ID = 50312;

export default function PreviewEventPage() {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventFormData | null>(null);
  const [ticketType, setTicketType] = useState("free");
  const [regularPrice, setRegularPrice] = useState("");
  const [vipPrice, setVipPrice] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<bigint | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  
  const { 
    writeContract, 
    data: createEventHash, 
    isPending: isCreatingEvent,
    error: createEventError 
  } = useWriteContract();

  const { 
    writeContract: writeTicketContract, 
    data: createTicketHash, 
    isPending: isCreatingTicket,
    error: createTicketError 
  } = useWriteContract();

  // Wait for create event transaction
  const { 
    isLoading: isWaitingForEvent, 
    isSuccess: isEventSuccess,
    data: eventReceipt
  } = useWaitForTransactionReceipt({
    hash: createEventHash,
  });

  // Wait for create ticket transaction
  const { 
    isLoading: isWaitingForTicket, 
    isSuccess: isTicketSuccess 
  } = useWaitForTransactionReceipt({
    hash: createTicketHash,
  });

  // Initialize thirdweb storage
  const CLIENT_ID = "8ab9472dfcb0cf79e6f0a030ff00e643";
  const storage = new ThirdwebStorage({ clientId: CLIENT_ID });

  useEffect(() => {
    const storedData = localStorage.getItem("eventFormData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setEventData(parsedData);
    } else {
      router.push("/create");
    }
  }, [router]);

  // Extract event ID from transaction receipt when event creation succeeds
  useEffect(() => {
    if (isEventSuccess && eventReceipt) {
      try {
        const logs = parseEventLogs({
          abi: contractABI,
          logs: eventReceipt.logs,
          eventName: 'EventOrganized'
        });
        
        if (logs.length > 0) {
          const eventId = logs[0].args.eventId;
          console.log("Event created with ID:", eventId.toString());
          setCreatedEventId(eventId);
        }
      } catch (error) {
        console.error("Error parsing event logs:", error);
      }
    }
  }, [isEventSuccess, eventReceipt]);

  // Auto-create tickets after event creation
  useEffect(() => {
    if (createdEventId && !isCreatingTicket && !createTicketHash) {
      createTickets(createdEventId);
    }
  }, [createdEventId, isCreatingTicket, createTicketHash]);

  // Handle completion
  useEffect(() => {
    if (isTicketSuccess && createdEventId) {
      localStorage.removeItem("eventFormData");
      alert("Event published successfully!");
      router.push("/dashboard");
    }
  }, [isTicketSuccess, createdEventId, router]);

  const handleWalletConnection = async () => {
    if (!isConnected) {
      // Connect to MetaMask or first available connector
      const metamask = connectors.find(c => c.name.includes('MetaMask'));
      if (metamask) {
        connect({ connector: metamask });
      } else {
        connect({ connector: connectors[0] });
      }
      return;
    }

    // Switch to Somnia testnet if not already connected
    if (chainId !== SOMNIA_TESTNET_ID) {
      try {
        await switchChain({ 
          chainId: SOMNIA_TESTNET_ID 
        });
      } catch (error) {
        console.error("Failed to switch network:", error);
        alert("Please manually add Somnia Shannon Testnet to your wallet and switch to it.");
      }
    }
  };

  const uploadBannerToIPFS = async (bannerPreview: string) => {
    if (!bannerPreview) return "";

    try {
      const base64Data = bannerPreview.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });
      const file = new File([blob], "event-banner.jpg", { type: "image/jpeg" });

      const uploadResult = await storage.upload(file);
      const bannerCID = storage.resolveScheme(uploadResult);
      console.log("Banner uploaded to IPFS with CID:", bannerCID);
      return bannerCID;
    } catch (error) {
      console.error("IPFS upload failed:", error);
      throw new Error(`Failed to upload banner to IPFS: ${error}`);
    }
  };

  const handlePublish = async () => {
    if (!eventData) return;

    setIsPublishing(true);

    try {
      // Check wallet connection and network
      if (!isConnected) {
        await handleWalletConnection();
        return;
      }

      if (chainId !== SOMNIA_TESTNET_ID) {
        await handleWalletConnection();
        return;
      }

      // Validate event data
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}:00`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error("Invalid date/time format");
      }

      const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
      const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
      const expected = parseInt(eventData.expectedAttendees);

      if (isNaN(expected) || expected <= 0) {
        throw new Error("Invalid expected attendees number");
      }

      const isPaid = ticketType === "paid";
      if (isPaid && (!regularPrice || !vipPrice)) {
        throw new Error("Both regular and VIP prices are required for paid events");
      }

      // Upload banner to IPFS
      const bannerCID = await uploadBannerToIPFS(eventData.bannerPreview || "");

      console.log("Creating event with params:", {
        eventName: eventData.eventName,
        eventDescription: eventData.eventDescription,
        location: eventData.location,
        startTimestamp,
        endTimestamp,
        expected,
        isPaid,
        bannerCID,
      });

      // Create event using Wagmi
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createEvent',
        args: [
          eventData.eventName,
          eventData.eventDescription,
          eventData.location,
          BigInt(startTimestamp),
          BigInt(endTimestamp),
          BigInt(expected),
          isPaid,
          bannerCID
        ],
      });

    } catch (error: any) {
      console.error("Publish error:", error);
      let errorMessage = "Failed to publish event";
      
      if (error.message?.includes("User denied")) {
        errorMessage = "Transaction was cancelled by user";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient STT tokens. Please claim more from the Somnia Testnet faucet.";
      } else if (error.message?.includes("IPFS")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setIsPublishing(false);
    }
  };

  const createTickets = (eventId: bigint) => {
    if (ticketType === "paid") {
      // Create regular ticket first
      writeTicketContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createTicket',
        args: [
          eventId,
          1, // REGULAR category
          parseEther(regularPrice)
        ],
      });
    } else {
      // Create free ticket
      writeTicketContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createTicket',
        args: [
          eventId,
          0, // NONE category (free)
          BigInt(0)
        ],
      });
    }
  };

  // Handle VIP ticket creation after regular ticket (for paid events)
  useEffect(() => {
    if (isTicketSuccess && ticketType === "paid" && createdEventId && vipPrice) {
      // Check if we just created the regular ticket, now create VIP
      writeTicketContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'createTicket',
        args: [
          createdEventId,
          2, // VIP category
          parseEther(vipPrice)
        ],
      });
    }
  }, [isTicketSuccess, ticketType, createdEventId, vipPrice]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const addSomniaNetwork = async () => {
    try {
      await switchChain({ chainId: SOMNIA_TESTNET_ID });
    } catch (error) {
      // If network doesn't exist, it will throw an error and the user needs to add it manually
      alert("Please manually add Somnia Shannon Testnet to your wallet:\n\n" +
            "Network Name: Somnia Shannon Testnet\n" +
            "RPC URL: https://dream-rpc.somnia.network\n" +
            "Chain ID: 50312\n" +
            "Currency Symbol: STT\n" +
            "Block Explorer: https://shannon-explorer.somnia.network");
    }
  };

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
    );
  }

  const isLoading = isPublishing || isCreatingEvent || isWaitingForEvent || isCreatingTicket || isWaitingForTicket;

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
              <a
                href="https://testnet.somnia.network"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Claim STT tokens here
              </a>{" "}
              to cover gas fees.
            </p>
            
            {/* Wallet Connection Status */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {!isConnected ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Wallet not connected</span>
                  <Button onClick={handleWalletConnection} size="sm">
                    Connect Wallet
                  </Button>
                </div>
              ) : chainId !== SOMNIA_TESTNET_ID ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Wrong network (Current: {chainId})</span>
                  <Button onClick={addSomniaNetwork} size="sm">
                    Switch to Somnia
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">✓ Connected to Somnia Testnet</span>
                  <span className="text-xs text-muted-foreground">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={addSomniaNetwork}
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
                    disabled={isLoading || !isConnected || chainId !== SOMNIA_TESTNET_ID}
                  >
                    {isLoading 
                      ? (isCreatingEvent || isWaitingForEvent ? "Creating Event..." 
                         : isCreatingTicket || isWaitingForTicket ? "Creating Tickets..." 
                         : "Publishing...")
                      : "Publish Event"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/create")}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Back to Edit
                  </Button>
                </div>

                {/* Error Display */}
                {(createEventError || createTicketError) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">
                      Error: {createEventError?.message || createTicketError?.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}