// src/components/ImagePickerModal.jsx
import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { listImages } from '@/services/data/gallery.js';

export default function ImagePickerModal({ show, onClose, onSelect }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!show) return;
    
    setItems(listImages());
  }, [show]);

  const isEmpty = items.length === 0;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>갤러리에서 이미지 선택</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isEmpty ? (
          <div className="text-center py-4">
            <p className="text-muted mb-3">갤러리에 이미지가 없습니다.</p>
            {/* 기존 이미지 라이브러리 경로: /library (사용자 프로젝트 기준) */}
            <a href="/library" className="btn btn-primary">갤러리로 이동</a>
          </div>
        ) : (
          <div className="row g-3">
            {items.map(img => (
              <div className="col-6 col-md-4" key={img.id}>
                <button
                  className="sbw-pick card p-0 w-100"
                  onClick={() => onSelect?.(img.url || img.src || img.path)}
                  aria-label="이미지 선택"
                >
                  <div className="ratio ratio-16x9">
                    <img
                      src={img.thumb || img.url || img.src || img.path}
                      alt=""
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>닫기</Button>
      </Modal.Footer>
    </Modal>
  );
}
