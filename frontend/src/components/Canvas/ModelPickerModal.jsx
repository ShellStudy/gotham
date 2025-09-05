// src/components/Canvas/ModelPickerModal.jsx
import React from 'react';
import { Modal, ListGroup, Button, Badge } from 'react-bootstrap';

export default function ModelPickerModal({ show, onHide, value, onSelect, options = [] }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>모델 선택</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ListGroup>
          {options.map(opt => {
            const active = opt.value === value;
            return (
              <ListGroup.Item
                key={opt.value}
                action
                active={active}
                onClick={() => onSelect?.(opt.value)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{opt.label}</div>
                    {opt.desc && <div className="text-muted small mt-1">{opt.desc}</div>}
                  </div>
                  {active && <Badge bg="success">선택됨</Badge>}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>닫기</Button>
      </Modal.Footer>
    </Modal>
  );
}
