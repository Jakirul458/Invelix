import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findProductByBarcode } from "@/lib/barcode-utils";
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
              barcode: product.barcode,
              stock_qty: product.stock_qty,
            });
            setBarcodeInput("");
            setLastScannedBarcode("");
            setScanFeedback(null);
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
      }, 500);
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
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto sm:max-h-screen sm:max-w-lg">
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

//         if (product) {
//           setScanFeedback("success");
//           playBeep("success");

//           // Add small delay for visual feedback
//           setTimeout(() => {
//             onProductFound({
//               product_id: product.id,
//               product_name: product.name,
//               quantity: 1,
//               selling_price: product.selling_price,
//               cost_price: product.cost_price,
//               gst_rate: product.gst_rate,
//               hsn_code: product.hsn_code,
//               stock_qty: product.stock_qty,
//             });
//             setBarcodeInput("");
//             setLastScannedBarcode("");
//             setScanFeedback(null);
//             // Don't close dialog - let user scan more
//           }, 600);
//         } else {
//           setScanFeedback("error");
//           playBeep("error");
//           onError(`Product not found for barcode: ${cleanBarcode}`);
//           setTimeout(() => setScanFeedback(null), 1500);
//         }
//       } catch (err) {
//         console.error("Scan processing error:", err);
//         setScanFeedback("error");
//         playBeep("error");
//         onError("Error processing barcode");
//         setTimeout(() => setScanFeedback(null), 1500);
//       } finally {
//         setIsScanning(false);
//       }
//     },
//     [ownerId, onProductFound, onError, lastScannedBarcode]
//   );

//   // Handle keyboard input
//   const handleKeyDown = useCallback(
//     (e: React.KeyboardEvent<HTMLInputElement>) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         processScan(barcodeInput);
//       }
//     },
//     [barcodeInput, processScan]
//   );

//   // Debounce barcode processing
//   useEffect(() => {
//     if (scanDebounceRef.current) {
//       clearTimeout(scanDebounceRef.current);
//     }

//     if (barcodeInput && scanMode === "keyboard") {
//       scanDebounceRef.current = setTimeout(() => {
//         if (barcodeInput.length >= 5) {
//           processScan(barcodeInput);
//         }
//       }, 500); // Allow time for full barcode entry
//     }

//     return () => {
//       if (scanDebounceRef.current) {
//         clearTimeout(scanDebounceRef.current);
//       }
//     };
//   }, [barcodeInput, scanMode, processScan]);

//   // Setup/cleanup
//   useEffect(() => {
//     if (open) {
//       setScanMode("keyboard");
//       setBarcodeInput("");
//       setLastScannedBarcode("");
//       setScanFeedback(null);
//       setTimeout(() => inputRef.current?.focus(), 100);
//     } else {
//       stopCamera();
//     }

//     return () => {
//       stopCamera();
//     };
//   }, [open, stopCamera]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-md">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Barcode className="h-5 w-5" />
//             Scan Product
//           </DialogTitle>
//           <DialogDescription>
//             Scan a barcode using your camera or barcode gun
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Mode Toggle */}
//           <div className="flex gap-2">
//             <Button
//               variant={scanMode === "keyboard" ? "default" : "outline"}
//               size="sm"
//               onClick={() => {
//                 setScanMode("keyboard");
//                 stopCamera();
//                 setTimeout(() => inputRef.current?.focus(), 100);
//               }}
//               className="flex-1"
//             >
//               Barcode Gun / Keyboard
//             </Button>
//             <Button
//               variant={scanMode === "camera" ? "default" : "outline"}
//               size="sm"
//               onClick={startCamera}
//               className="flex-1"
//               disabled={!navigator.mediaDevices?.getUserMedia}
//             >
//               Camera
//             </Button>
//           </div>

//           {/* Keyboard Mode */}
//           {scanMode === "keyboard" && (
//             <div className="space-y-2">
//               <Input
//                 ref={inputRef}
//                 placeholder="Place cursor here and scan barcode..."
//                 value={barcodeInput}
//                 onChange={(e) => setBarcodeInput(e.target.value)}
//                 onKeyDown={handleKeyDown}
//                 disabled={isScanning}
//                 className="font-mono text-center"
//                 autoFocus
//               />
//               <Button
//                 onClick={() => processScan(barcodeInput)}
//                 disabled={!barcodeInput || isScanning}
//                 className="w-full"
//               >
//                 {isScanning ? (
//                   <>
//                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                     Scanning...
//                   </>
//                 ) : (
//                   "Scan Barcode"
//                 )}
//               </Button>
//             </div>
//           )}

//           {/* Camera Mode */}
//           {scanMode === "camera" && cameraStream && (
//             <div className="space-y-2">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 className="w-full aspect-square bg-black rounded-lg object-cover"
//               />
//               <div className="text-center text-sm text-muted-foreground">
//                 Point camera at barcode
//               </div>
//               <Button
//                 variant="outline"
//                 onClick={stopCamera}
//                 className="w-full"
//               >
//                 Stop Camera
//               </Button>
//             </div>
//           )}

//           {/* Scan Feedback */}
//           {scanFeedback === "success" && (
//             <Alert className="border-green-200 bg-green-50">
//               <CheckCircle2 className="h-4 w-4 text-green-600" />
//               <AlertDescription className="text-green-800">
//                 Product found! Adding to invoice...
//               </AlertDescription>
//             </Alert>
//           )}

//           {scanFeedback === "error" && (
//             <Alert className="border-red-200 bg-red-50">
//               <AlertCircle className="h-4 w-4 text-red-600" />
//               <AlertDescription className="text-red-800">
//                 Product not found. Try another barcode.
//               </AlertDescription>
//             </Alert>
//           )}

//           {/* Tips */}
//           <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
//             <p className="font-semibold mb-1">💡 Tips:</p>
//             <ul className="list-disc list-inside space-y-1">
//               <li>Scan products or use Enter key to process</li>
//               <li>Works with physical barcode guns</li>
//               <li>Camera mode requires permission</li>
//               <li>~300ms debounce to prevent duplicates</li>
//             </ul>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

// /**
//  * Play audio feedback for scan results
//  */
// function playBeep(type: "success" | "error") {
//   try {
//     // Create oscillator for beep sound
//     const audioContext = new (window.AudioContext ||
//       (window as any).webkitAudioContext)();
//     const oscillator = audioContext.createOscillator();
//     const gainNode = audioContext.createGain();

//     oscillator.connect(gainNode);
//     gainNode.connect(audioContext.destination);

//     if (type === "success") {
//       oscillator.frequency.value = 800; // Higher pitch for success
//       gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
//       oscillator.start(audioContext.currentTime);
//       oscillator.stop(audioContext.currentTime + 0.2);
//     } else {
//       oscillator.frequency.value = 400; // Lower pitch for error
//       gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
//       oscillator.start(audioContext.currentTime);
//       oscillator.stop(audioContext.currentTime + 0.3);
//     }
//   } catch (err) {
//     console.error("Beep sound failed:", err);
//   }
// }

// export default BarcodeScanner;








import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Keyboard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductScanned: (product: any) => void;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onProductScanned,
}: BarcodeScannerProps) {
  const { user } = useAuthStore();
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [useCameraMode, setUseCameraMode] = useState(true);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Check if barcode scanner API is available (mobile devices)
  const isBarcodeDetectorAvailable = 
    typeof window !== 'undefined' && 
    'BarcodeDetector' in window;

  // Start camera when dialog opens in camera mode
  useEffect(() => {
    if (open && useCameraMode) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, useCameraMode]);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setVideoStream(stream);
      
      // Get video element and set stream
      const videoElement = document.getElementById('barcode-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
        
        // Start scanning if BarcodeDetector is available
        if (isBarcodeDetectorAvailable) {
          startBarcodeDetection(videoElement);
        }
      }
      
      setIsScanning(false);
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access or use manual entry",
        variant: "destructive"
      });
      setIsScanning(false);
      setUseCameraMode(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const startBarcodeDetection = async (videoElement: HTMLVideoElement) => {
    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const barcodeDetector = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      const detectBarcodes = async () => {
        if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(detectBarcodes);
          return;
        }

        try {
          const barcodes = await barcodeDetector.detect(videoElement);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue;
            handleBarcodeScanned(barcode);
          } else {
            requestAnimationFrame(detectBarcodes);
          }
        } catch (err) {
          console.error('Barcode detection error:', err);
          requestAnimationFrame(detectBarcodes);
        }
      };

      detectBarcodes();
    } catch (error) {
      console.error('BarcodeDetector initialization error:', error);
      toast({
        title: "Scanner not available",
        description: "Please use manual barcode entry",
        variant: "destructive"
      });
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    stopCamera();
    
    // Search for product by barcode
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, selling_price, cost_price, gst_rate, barcode, stock_qty")
      .eq("barcode", barcode)
      .eq("owner_id", user?.id)
      .single();

    if (error || !product) {
      toast({
        title: "Product not found",
        description: `No product with barcode "${barcode}"`,
        variant: "destructive"
      });
      onOpenChange(false);
      return;
    }

    onProductScanned({
      product_id: product.id,
      product_name: product.name,
      selling_price: product.selling_price,
      cost_price: product.cost_price,
      gst_rate: product.gst_rate || 18,
    });

    onOpenChange(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleBarcodeScanned(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle>Scan Product Barcode</DialogTitle>
          <DialogDescription>
            Scan a product barcode or enter it manually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={useCameraMode ? "default" : "outline"}
              onClick={() => setUseCameraMode(true)}
              className="flex-1 gap-2 rounded-lg"
            >
              <Camera className="h-4 w-4" />
              Camera
            </Button>
            <Button
              type="button"
              variant={!useCameraMode ? "default" : "outline"}
              onClick={() => {
                stopCamera();
                setUseCameraMode(false);
              }}
              className="flex-1 gap-2 rounded-lg"
            >
              <Keyboard className="h-4 w-4" />
              Manual
            </Button>
          </div>

          {/* Camera Mode */}
          {useCameraMode && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {isScanning ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                ) : (
                  <>
                    <video
                      id="barcode-video"
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-32 border-2 border-white rounded-lg shadow-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {!isBarcodeDetectorAvailable && (
                <p className="text-xs text-amber-600 text-center">
                  Automatic scanning not available. Please use manual entry.
                </p>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                Position the barcode within the frame
              </p>
            </div>
          )}

          {/* Manual Entry Mode */}
          {!useCameraMode && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="manual-barcode" className="text-sm font-medium">
                  Enter Barcode
                </Label>
                <Input
                  id="manual-barcode"
                  type="text"
                  placeholder="e.g. 1234567890123"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="h-10 rounded-lg font-mono text-lg"
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="w-full h-10 rounded-lg bg-foreground text-background hover:bg-foreground/90"
              >
                Add Product
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}