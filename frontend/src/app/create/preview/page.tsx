"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useSwitchChain, useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, parseEventLogs } from 'viem';
import { contractAddress, contractABI } from "../../../contractAddressandAbi";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import Image from "next/image";

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
  const [ticketType, setTicketType] = useState<"free" | "paid">("free");
  const [regularPrice, setRegularPrice] = useState("");
  const [vipPrice, setVipPrice] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<bigint | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const { writeContract, data: createEventHash, isPending: isCreatingEvent, error: createEventError } = useWriteContract();
  const { writeContract: writeTicketContract, data: createTicketHash, isPending: isCreatingTicket, error: createTicketError } = useWriteContract();

  // Wait for create event transaction
  const { isLoading: isWaitingForEvent, isSuccess: isEventSuccess, data: eventReceipt } = useWaitForTransactionReceipt({
    hash: createEventHash,
  });

  // Wait for create ticket transaction
  const { isLoading: isWaitingForTicket, isSuccess: isTicketSuccess } = useWaitForTransactionReceipt({
    hash: createTicketHash,
  });

  // Initialize thirdweb storage
  const CLIENT_ID = "8ab9472dfcb0cf79e6f0a030ff00e643";
  const storage = new ThirdwebStorage({ clientId: CLIENT_ID });

  useEffect(() => {
    const storedData = localStorage.getItem("eventFormData");
    if (storedData) {
      const parsedData: EventFormData = JSON.parse(storedData);
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
        // Use type assertion to unknown first, then to the expected type
        const log = logs[0] as unknown as { args: { eventId: bigint } };
        const eventId = log.args.eventId;
        console.log("Event created with ID:", eventId.toString());
        setCreatedEventId(eventId);
      }
    } catch (error) {
      console.error("Error parsing event logs:", error);
    }
  }
}, [isEventSuccess, eventReceipt]);

  // Move createTickets function inside useCallback to fix dependency warning
  const createTickets = useCallback((eventId: bigint) => {
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
  }, [ticketType, regularPrice, writeTicketContract]);

  // Auto-create tickets after event creation
  useEffect(() => {
    if (createdEventId && !isCreatingTicket && !createTicketHash) {
      createTickets(createdEventId);
    }
  }, [createdEventId, isCreatingTicket, createTicketHash, createTickets]);

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
        await switchChain({ chainId: SOMNIA_TESTNET_ID });
      } catch (error) {
        console.error("Failed to switch network:", error);
        alert("Please manually add Somnia Shannon Testnet to your wallet and switch to it.");
      }
    }
  };

  const uploadBannerToIPFS = async (bannerPreview: string): Promise<string> => {
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
      if (!isConnected || chainId !== SOMNIA_TESTNET_ID) {
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
    } catch (err) {
      console.error("Publish error:", err);
      let errorMessage = "Failed to publish event";
      if (err instanceof Error) {
        if (err.message?.includes("User denied")) {
          errorMessage = "Transaction was cancelled by user";
        } else if (err.message?.includes("insufficient funds")) {
          errorMessage = "Insufficient STT tokens. Please claim more from the Somnia Testnet faucet.";
        } else if (err.message?.includes("IPFS")) {
          errorMessage = err.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      alert(errorMessage);
      setIsPublishing(false);
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
  }, [isTicketSuccess, ticketType, createdEventId, vipPrice, writeTicketContract]);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const addSomniaNetwork = async () => {
    try {
      await switchChain({ chainId: SOMNIA_TESTNET_ID });
    } catch {
      alert(
        "Please manually add Somnia Shannon Testnet to your wallet:\n\n" +
        "Network Name: Somnia Shannon Testnet\n" +
        "RPC URL: https://dream-rpc.somnia.network\n" +
        "Chain ID: 50312\n" +
        "Currency Symbol: STT\n" +
        "Block Explorer: https://shannon-explorer.somnia.network"
      );
    }
  };

  if (!eventData) {
    return <div>Loading event preview...</div>;
  }

  const isLoading = isPublishing || isCreatingEvent || isWaitingForEvent || isCreatingTicket || isWaitingForTicket;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Event Preview</h1>
        <p className="text-muted-foreground mb-4">
          Review your event details and set ticket pricing. Publishing requires STT tokens from the Somnia Testnet faucet (free).
        </p>
        <p className="text-muted-foreground mb-6">
          <a
            href="https://faucet.somnia.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Claim STT tokens here
          </a>{" "}
          to cover gas fees.
        </p>

        {/* Wallet Connection Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {!isConnected ? (
              <Button onClick={handleWalletConnection}>Connect Wallet</Button>
            ) : chainId !== SOMNIA_TESTNET_ID ? (
              <Button onClick={handleWalletConnection}>
                Wrong network (Current: {chainId}) Switch to Somnia
              </Button>
            ) : (
              <p>✓ Connected to Somnia Testnet {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            )}
            <Button onClick={addSomniaNetwork} className="mt-4">
              Add Somnia Testnet to Wallet
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            {eventData.bannerPreview && (
              <Image
                src={eventData.bannerPreview || "/placeholder.svg"}
                alt="Event Banner"
                width={1200}
                height={300}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            )}
            <h2 className="text-2xl font-semibold mt-4">{eventData.eventName}</h2>
            <p className="text-muted-foreground">{eventData.eventDescription}</p>
            <p className="mt-2">Start: {formatDate(eventData.startDate)} {formatTime(eventData.startTime)}</p>
            <p>End: {formatDate(eventData.endDate)} {formatTime(eventData.endTime)}</p>
            <p>{eventData.location}</p>
            <p>Expected Attendees: {eventData.expectedAttendees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={ticketType} 
              onValueChange={(value) => setTicketType(value as "free" | "paid")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">Free Event</Label>
              </div>
              <p className="text-muted-foreground ml-6">No charge for attendees</p>
              <div className="flex items-center space-x-2 mt-4">
                <RadioGroupItem value="paid" id="paid" />
                <Label htmlFor="paid">Paid Event</Label>
              </div>
              <p className="text-muted-foreground ml-6">Set prices for different ticket types</p>
            </RadioGroup>
            {ticketType === "paid" && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="regularPrice">Regular Ticket Price (STT)</Label>
                  <Input
                    id="regularPrice"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    type="number"
                    step="0.001"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="vipPrice">VIP Ticket Price (STT)</Label>
                  <Input
                    id="vipPrice"
                    value={vipPrice}
                    onChange={(e) => setVipPrice(e.target.value)}
                    type="number"
                    step="0.001"
                    min="0"
                  />
                </div>
              </div>
            )}
            <div className="flex space-x-4 mt-6">
              <Button onClick={handlePublish} disabled={isLoading}>
                {isLoading
                  ? isCreatingEvent || isWaitingForEvent
                    ? "Creating Event..."
                    : isCreatingTicket || isWaitingForTicket
                    ? "Creating Tickets..."
                    : "Publishing..."
                  : "Publish Event"}
              </Button>
              <Button
                onClick={() => router.push("/create")}
                className="w-full"
                disabled={isLoading}
                variant="outline"
              >
                Back to Edit
              </Button>
            </div>
            {(createEventError || createTicketError) && (
              <p className="text-red-500 mt-4">
                Error: {createEventError?.message || createTicketError?.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}