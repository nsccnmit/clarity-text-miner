import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import { Upload, FileText, Image as ImageIcon, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ExtractedData {
  text: string;
  confidence: number;
  fileName: string;
  fileType: string;
  timestamp: string;
  wordCount: number;
}

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text, confidence } } = await worker.recognize(file);
      await worker.terminate();

      const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;

      const result: ExtractedData = {
        text: text.trim(),
        confidence: Math.round(confidence),
        fileName: file.name,
        fileType: file.type,
        timestamp: new Date().toISOString(),
        wordCount
      };

      setExtractedData(result);
      toast.success(`Text extracted successfully! Found ${wordCount} words.`);
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Failed to extract text. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processPDF = async (file: File) => {
    toast.error('PDF processing requires a backend service. Please use image files for now.');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      await processPDF(file);
    } else {
      await processImage(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const copyToClipboard = async () => {
    if (!extractedData) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
      toast.success('JSON copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const reset = () => {
    setExtractedData(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            OCR Text Extractor
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Upload images or PDFs to extract text using advanced OCR technology. 
            Get results in clean JSON format.
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
            <div
              {...getRootProps()}
              className={`p-8 md:p-12 text-center cursor-pointer transition-all duration-300 rounded-lg border-2 border-dashed ${
                isDragActive || dragActive
                  ? 'border-purple-300 bg-purple-500/20 scale-105'
                  : 'border-purple-500/50 hover:border-purple-400 hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isDragActive ? 'bg-purple-500 text-white' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {isDragActive ? 'Drop your file here' : 'Upload Image or PDF'}
                  </h3>
                  <p className="text-purple-200">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-purple-300 mt-2">
                    Supports: PNG, JPG, JPEG, GIF, BMP, PDF
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Processing Status */}
          {isProcessing && (
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                  <h3 className="text-lg font-semibold text-white">Processing Image...</h3>
                </div>
                <Progress value={progress} className="w-full h-2 bg-purple-500/20" />
                <p className="text-purple-200 text-sm mt-2">{progress}% complete</p>
              </div>
            </Card>
          )}

          {/* Results */}
          {extractedData && (
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <span>Extraction Complete</span>
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="bg-purple-500/20 border-purple-400 text-purple-200 hover:bg-purple-500/30"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy JSON
                    </Button>
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="bg-blue-500/20 border-blue-400 text-blue-200 hover:bg-blue-500/30"
                    >
                      New Upload
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-purple-300 text-sm">Words Found</p>
                    <p className="text-white text-xl font-bold">{extractedData.wordCount}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-purple-300 text-sm">Confidence</p>
                    <p className="text-white text-xl font-bold">{extractedData.confidence}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-purple-300 text-sm">File Type</p>
                    <p className="text-white text-sm font-medium">{extractedData.fileType.split('/')[1].toUpperCase()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-purple-300 text-sm">File Name</p>
                    <p className="text-white text-sm font-medium truncate">{extractedData.fileName}</p>
                  </div>
                </div>

                {/* JSON Output */}
                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-white">JSON Output:</h4>
                  <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-green-300 whitespace-pre-wrap">
                      {JSON.stringify(extractedData, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Extracted Text Preview */}
                {extractedData.text && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-lg font-medium text-white">Extracted Text Preview:</h4>
                    <div className="bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-purple-100 whitespace-pre-wrap">
                        {extractedData.text.substring(0, 500)}
                        {extractedData.text.length > 500 && '...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl p-6 text-center">
              <ImageIcon className="w-12 h-12 text-purple-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Image OCR</h3>
              <p className="text-purple-200 text-sm">
                Extract text from images with high accuracy using Tesseract.js
              </p>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl p-6 text-center">
              <FileText className="w-12 h-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">JSON Output</h3>
              <p className="text-purple-200 text-sm">
                Get structured JSON data with metadata and confidence scores
              </p>
            </Card>
            
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">High Accuracy</h3>
              <p className="text-purple-200 text-sm">
                Advanced OCR technology with confidence scoring and word counting
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
