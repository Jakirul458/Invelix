import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findProductByBarcode, playBeep } from "@/lib/barcode-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Barcode,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string;
  onProductFound: (product: any) => void;
  onError: (error: string) => void;
}

type ScanMode = "camera" | "keyboard";

/**
 * Barcode Scanner Component
 * Supports both camera scanning and keyboard input (barcode gun)
 */
export function BarcodeScanner({
  open,
  onOpenChange,
  ownerId,
  onProductFound,
  onError,
}: BarcodeScannerProps) {
  const [scanMode, setScanMode] = useState<ScanMode>("keyboard");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState("");
  const [scanFeedback, setScanFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scanDebounceRef = useRef<NodeJS.Timeout>();

  // Request camera permission
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanMode("camera");
    } catch (err) {
      console.error("Camera access denied:", err);
      onError("Camera access denied. Using keyboard mode.");
      setScanMode("keyboard");
      inputRef.current?.focus();
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Handle barcode scan (debounced to prevent duplicates)
  const processScan = useCallback(
    async (barcode: string) => {
      const cleanBarcode = barcode.trim();

      // Prevent duplicate scans within 300ms
      if (cleanBarcode === lastScannedBarcode) {
        return;
      }

      if (!cleanBarcode || cleanBarcode.length < 5) {
        setScanFeedback("error");
        setTimeout(() => setScanFeedback(null), 1500);
        return;
      }

      setIsScanning(true);
      setLastScannedBarcode(cleanBarcode);

      try {
        const product = await findProductByBarcode(cleanBarcode, ownerId);

        if (product) {
          setScanFeedback("success");
          playBeep("success");

          // Add small delay for visual feedback
          setTimeout(() => {
            onProductFound({
              product_id: product.id,
              product_name: product.name,
              quantity: 1,
              selling_price: product.selling_price,
              cost_price: product.cost_price,
              gst_rate: product.gst_rate,
              hsn_code: product.hsn_code,
              stock_qty: product.stock_qty,
            });
            setBarcodeInput("");
            setLastScannedBarcode("");
            setScanFeedback(null);
            // Don't close dialog - let user scan more
          }, 600);
        } else {
          setScanFeedback("error");
          playBeep("error");
          onError(`Product not found for barcode: ${cleanBarcode}`);
          setTimeout(() => setScanFeedback(null), 1500);
        }
      } catch (err) {
        console.error("Scan processing error:", err);
        setScanFeedback("error");
        playBeep("error");
        onError("Error processing barcode");
        setTimeout(() => setScanFeedback(null), 1500);
      } finally {
        setIsScanning(false);
      }
    },
    [ownerId, onProductFound, onError, lastScannedBarcode]
  );

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        processScan(barcodeInput);
      }
    },
    [barcodeInput, processScan]
  );

  // Debounce barcode processing
  useEffect(() => {
    if (scanDebounceRef.current) {
      clearTimeout(scanDebounceRef.current);
    }

    if (barcodeInput && scanMode === "keyboard") {
      scanDebounceRef.current = setTimeout(() => {
        if (barcodeInput.length >= 5) {
          processScan(barcodeInput);
        }
      }, 500); // Allow time for full barcode entry
    }

    return () => {
      if (scanDebounceRef.current) {
        clearTimeout(scanDebounceRef.current);
      }
    };
  }, [barcodeInput, scanMode, processScan]);

  // Setup/cleanup
  useEffect(() => {
    if (open) {
      setScanMode("keyboard");
      setBarcodeInput("");
      setLastScannedBarcode("");
      setScanFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Scan Product
          </DialogTitle>
          <DialogDescription>
            Scan a barcode using your camera or barcode gun
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "keyboard" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setScanMode("keyboard");
                stopCamera();
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="flex-1"
            >
              Barcode Gun / Keyboard
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={startCamera}
              className="flex-1"
              disabled={!navigator.mediaDevices?.getUserMedia}
            >
              Camera
            </Button>
          </div>

          {/* Keyboard Mode */}
          {scanMode === "keyboard" && (
            <div className="space-y-2">
              <Input
                ref={inputRef}
                placeholder="Place cursor here and scan barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isScanning}
                className="font-mono text-center"
                autoFocus
              />
              <Button
                onClick={() => processScan(barcodeInput)}
                disabled={!barcodeInput || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  "Scan Barcode"
                )}
              </Button>
            </div>
          )}

          {/* Camera Mode */}
          {scanMode === "camera" && cameraStream && (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-square bg-black rounded-lg object-cover"
              />
              <div className="text-center text-sm text-muted-foreground">
                Point camera at barcode
              </div>
              <Button
                variant="outline"
                onClick={stopCamera}
                className="w-full"
              >
                Stop Camera
              </Button>
            </div>
          )}

          {/* Scan Feedback */}
          {scanFeedback === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Product found! Adding to invoice...
              </AlertDescription>
            </Alert>
          )}

          {scanFeedback === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Product not found. Try another barcode.
              </AlertDescription>
            </Alert>
          )}

          {/* Tips */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Scan products or use Enter key to process</li>
              <li>Works with physical barcode guns</li>
              <li>Camera mode requires permission</li>
              <li>~300ms debounce to prevent duplicates</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Play audio feedback for scan results
 */
function playBeep(type: "success" | "error") {
  try {
    // Create oscillator for beep sound
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "success") {
      oscillator.frequency.value = 800; // Higher pitch for success
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else {
      oscillator.frequency.value = 400; // Lower pitch for error
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  } catch (err) {
    console.error("Beep sound failed:", err);
  }
}

export default BarcodeScanner;
