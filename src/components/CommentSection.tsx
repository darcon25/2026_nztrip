import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Trash2, Clock, User, MapPin, FileText, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../DataContext';

interface Comment {
  id: number;
  day_id: number;
  item_idx: number;
  text: string;
  author: string;
  timestamp: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

interface CommentSectionProps {
  dayId: number;
  itemIdx: number;
}

interface ResolvedMapInfo {
  url: string;
  placeName: string;
  coords?: {
    lat: number;
    lng: number;
  };
}

// Google Maps 連結處理工具函數 - 支持多種 URL 格式
const extractGoogleMapsLink = (text: string) => {
  // 支持所有 Google Maps URL 格式：
  // 1. https://www.google.com/maps/...
  // 2. https://maps.google.com/...
  // 3. https://goo.gl/maps/...
  // 4. https://maps.app.goo.gl/... (最新短鏈接)
  const patterns = [
    /https?:\/\/maps\.app\.goo\.gl\/[^\s]+/gi,      // 新的短鏈接格式
    /https?:\/\/(?:www\.)?google\.com\/maps\/[^\s]+/gi,
    /https?:\/\/(?:www\.)?maps\.google\.com[^\s]+/gi,
    /https?:\/\/goo\.gl\/maps\/[^\s]+/gi,
  ];
  
  let found = null;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      found = match[0];
      break;
    }
  }
  
  if (!found) {
    console.log('No maps link found in text');
    return null;
  }
  
  // 嘗試提取坐標或地點名稱
  let coords = null;
  let placeName = 'Google Maps 地點';
  
  // 從 URL 中提取坐標 (/@lat,lng 或 !3d/!4d 格式)
  const coordMatch = found.match(/@([\-\d.]+),([\-\d.]+)/);
  if (coordMatch) {
    coords = `${coordMatch[1]},${coordMatch[2]}`;
    placeName = `座標: ${coords}`;
  } else {
    const coordMatch2 = found.match(/!3d([\-\d.]+)!4d([\-\d.]+)/);
    if (coordMatch2) {
      coords = `${coordMatch2[1]},${coordMatch2[2]}`;
      placeName = `座標: ${coords}`;
    }
  }
  
  // 嘗試從 place 參數或搜尋詞提取地點名稱
  const placeMatch = found.match(/place\/([^/@?&]+)/);
  if (placeMatch) {
    placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  } else {
    const searchMatch = found.match(/query=([^&]+)|q=([^&]+)/);
    if (searchMatch) {
      placeName = decodeURIComponent((searchMatch[1] || searchMatch[2]).replace(/\+/g, ' '));
    }
  }
  
  console.log('Found Maps link:', { url: found, placeName, coords });
  return { url: found, name: placeName, coords };
};

// Async component for rendering comment text with Maps link resolution
function CommentTextRenderer({ text }: { text: string }) {
  const mapsLink = React.useMemo(() => extractGoogleMapsLink(text), [text]);
  const [resolvedInfo, setResolvedInfo] = useState<ResolvedMapInfo | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!mapsLink) {
      setResolvedInfo(null);
      setIsResolving(false);
      return;
    }

    if (mapsLink.url.includes('maps.app.goo.gl')) {
      setIsResolving(true);
      fetch('/api/maps/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: mapsLink.url,
        }),
      })
        .then(res => res.json())
        .then(data => {
          console.log('Place info resolved:', data);
          setResolvedInfo(data);
        })
        .catch(error => {
          console.error('Failed to resolve place info:', error);
          setResolvedInfo({
            url: mapsLink.url,
            placeName: mapsLink.name,
            coords: undefined,
          });
        })
        .finally(() => setIsResolving(false));
    } else {
      setResolvedInfo(null);
      setIsResolving(false);
    }
  }, [mapsLink?.url, mapsLink?.name]);

  if (!mapsLink) {
    // 沒有 Google Maps 連結，直接返回文本
    return (
      <div className="space-y-2">
        <p className="text-sm text-slate-300">{text}</p>
      </div>
    );
  }

  // 如果有 Google Maps 連結，分離文本和連結
  const linkIndex = text.toLowerCase().indexOf(mapsLink.url.toLowerCase());
  const beforeLink = text.substring(0, linkIndex).trim();
  const afterLink = text.substring(linkIndex + mapsLink.url.length).trim();

  // 使用解析後的地點名稱，或者使用提取的名稱
  const displayName = resolvedInfo?.placeName || mapsLink.name;
  const mapUrl = resolvedInfo?.url || mapsLink.url;
  const coords = resolvedInfo?.coords;
  const mapCenter = coords ? `${coords.lat},${coords.lng}` : null;
  const staticMapUrl = coords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=400x300&markers=${coords.lat},${coords.lng},red-pushpin`
    : null;

  console.log('Rendering comment with maps link:', { displayName, mapUrl, coords, isResolving });

  return (
    <div className="space-y-3">
      {beforeLink && !beforeLink.includes('://') && <p className="text-sm text-slate-300">{beforeLink}</p>}
      
      {/* Google Maps 卡片 */}
      <div className="bg-gradient-to-br from-sky-900/40 to-blue-900/40 border-2 border-sky-400/50 rounded-xl overflow-hidden hover:border-sky-400 transition-all shadow-lg">
        {/* 地點名稱 */}
        <div className="px-4 py-3 bg-sky-600/30 border-b border-sky-400/30">
          <h3 className="font-bold text-sky-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-300" />
            {isResolving ? (
              <span className="text-slate-400 italic">解析中...</span>
            ) : (
              displayName
            )}
          </h3>
        </div>

        {/* 地圖縮圖或占位符 */}
        <div className="relative w-full h-48 bg-slate-700/50 flex items-center justify-center overflow-hidden">
          {staticMapUrl ? (
            <img
              src={staticMapUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-slate-400 text-center py-8"><div class="inline-block p-3 bg-sky-600/30 rounded-full mb-2"><svg class="w-8 h-8 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div><p class="text-slate-400 text-sm">點擊查看地圖</p></div>';
                }
              }}
            />
          ) : (
            <div className="text-center py-8 px-4">
              <div className="inline-block p-3 bg-sky-600/30 rounded-full mb-2">
                <MapPin className="w-8 h-8 text-sky-300" />
              </div>
              <p className="text-slate-400 text-sm">無法顯示縮圖，請點擊查看地圖位置</p>
            </div>
          )}
        </div>

        {/* 可點擊按鈕 */}
        <div className="px-4 py-3 bg-sky-600/20 border-t border-sky-400/30">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-lg transition-all font-semibold transform hover:scale-105"
          >
            在 Google Maps 打開
          </a>
        </div>
      </div>

      {afterLink && <p className="text-sm text-slate-300">{afterLink}</p>}
    </div>
  );
}

export default function CommentSection({ dayId, itemIdx }: CommentSectionProps) {
  const { budget: familyBudgets } = useData();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(familyBudgets[0]?.name || '');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments/${dayId}/${itemIdx}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched comments:', data);
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to read file as base64'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setAttachment(null);
      setAttachmentPreview(null);
      return;
    }

    // 支援的檔案副檔名
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      alert('請上傳 PDF、Word 或 PNG/JPG 檔案');
      e.target.value = '';
      return;
    }

    setAttachment(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachmentPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [dayId, itemIdx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', { newComment, selectedAuthor, attachment, isLoading });
    
    if ((!newComment.trim() && !attachment) || !selectedAuthor) {
      console.log('Validation failed:', { 
        hasComment: !!newComment.trim(), 
        hasAttachment: !!attachment,
        hasAuthor: !!selectedAuthor 
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if the comment contains a Google Maps link
      let commentText = newComment.trim();
      const mapsLinkMatch = newComment.match(/https?:\/\/maps\.app\.goo\.gl\/[^\s]+|https?:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com)[^\s]+/i);
      
      if (mapsLinkMatch) {
        // Try to resolve the maps link to get place name
        try {
          console.log('Resolving maps link:', mapsLinkMatch[0]);
          const resolveResponse = await fetch('/api/maps/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: mapsLinkMatch[0],
            }),
          });

          if (resolveResponse.ok) {
            const resolveData = await resolveResponse.json();
            console.log('Resolved maps info:', resolveData);
            // Keep the original comment text (just the link) 
            // The rendering will extract the place name
          }
        } catch (error) {
          console.error('Failed to resolve maps link:', error);
          // Continue with original comment text
        }
      }

      let response;

      if (attachment) {
        // Use FormData only when there's a file attachment
        const formData = new FormData();
        formData.append('dayId', dayId.toString());
        formData.append('itemIdx', itemIdx.toString());
        formData.append('text', commentText);
        formData.append('author', selectedAuthor);
        formData.append('file', attachment);

        console.log('Submitting with file attachment:', { name: attachment.name, type: attachment.type, size: attachment.size });

        response = await fetch('/api/comments', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for text-only comments
        console.log('Submitting text-only comment:', { dayId, itemIdx, text: commentText, author: selectedAuthor });

        response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayId,
            itemIdx,
            text: commentText,
            author: selectedAuthor,
          }),
        });
      }

      if (response.ok) {
        const newCommentData = await response.json();
        console.log('Comment posted successfully:', newCommentData);
        setNewComment('');
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedAuthor(familyBudgets[0]?.name || ''); // 重置為默認選擇
        // 立即新增留言到列表而不是重新查詢
        setComments([newCommentData, ...comments]);
      } else {
        const errorText = await response.text();
        console.error('Failed to post comment:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: errorText
        });
        alert(`無法送出留言：${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
      <div className="flex items-center gap-2 text-white font-black text-sm">
        <MessageSquare className="w-4 h-4 text-sky-400" />
        留言對話
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">留言者：</label>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="flex-1 bg-slate-800 border-2 border-transparent rounded-xl px-4 py-2 text-sm font-medium text-white focus:bg-slate-700 focus:border-sky-500 focus:outline-none"
          >
            {familyBudgets.map(family => (
              <option key={family.id} value={family.name}>{family.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => {
                console.log('Input changed:', e.target.value);
                setNewComment(e.target.value);
              }}
              placeholder="貼上 Google Maps 連結或留言內容"
              className="w-full bg-slate-800 border-2 border-transparent rounded-xl px-4 py-3 pr-12 text-sm font-medium text-white placeholder:text-slate-500 focus:bg-slate-700 focus:border-sky-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || (!newComment.trim() && !attachment) || !selectedAuthor}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                isLoading || (!newComment.trim() && !attachment) || !selectedAuthor
                  ? 'text-slate-500 opacity-50 cursor-not-allowed'
                  : 'text-sky-400 hover:bg-sky-900/50 cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-800 border-2 border-transparent rounded-xl px-4 py-3 flex flex-col gap-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">上傳附件</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="text-xs text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-100 file:cursor-pointer"
            />
            {attachment && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/70 px-3 py-2 border border-slate-700">
                <div className="flex items-center gap-2">
                  {attachment.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-sky-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-300" />
                  )}
                  <span className="text-xs text-slate-300 truncate">{attachment.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    setAttachmentPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-slate-100"
                >
                  移除
                </button>
              </div>
            )}
            {attachmentPreview && (
              <div className="overflow-hidden rounded-2xl border border-slate-700">
                <img src={attachmentPreview} alt="附件預覽" className="w-full h-auto object-cover" />
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar pr-1">
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 group"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-sky-600/50 p-1.5 rounded-lg">
                    <User className="w-3 h-3 text-sky-400" />
                  </div>
                  <span className="text-xs font-black text-sky-400 uppercase tracking-widest">
                    {comment.author}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="刪除留言"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="space-y-3 mb-2">
                <CommentTextRenderer text={comment.text} />
                {comment.attachment_url && (
                  <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-3">
                    {comment.attachment_type?.startsWith('image/') ? (
                      <a
                        href={comment.attachment_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block overflow-hidden rounded-3xl border border-slate-700 bg-slate-800"
                      >
                        <img
                          src={comment.attachment_url}
                          alt={comment.attachment_name || '留言圖片'}
                          className="w-full h-auto object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        href={comment.attachment_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:border-sky-400"
                      >
                        <FileText className="w-4 h-4 text-sky-400" />
                        {comment.attachment_name || '下載附件'}
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                <Clock className="w-3 h-3" />
                {new Date(comment.timestamp).toLocaleString('zh-TW', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p className="text-center text-xs text-slate-500 font-medium italic py-4">
            尚無留言，快來搶頭香！
          </p>
        )}
      </div>
    </div>
  );
}
