"use client";
import * as React from "react";
import type { Form8_1Report } from "./types";

type Props = {
  value?: Partial<Form8_1Report>;
  onChange: (patch: Partial<Form8_1Report>) => void;
};

// 1.1 ขอบเขตงาน (อิงโครงจาก .bak)
export default function Main1_General({ value, onChange }: Props) {
  const v = value || {};
  // ลดการอัปเดตขึ้น orchestrator ทุกคีย์สโตรก: ใช้ draft + commit onBlur
  const [scopeDraft, setScopeDraft] = React.useState<string>(v.inspectionScopeNote || "");
  React.useEffect(() => { setScopeDraft(v.inspectionScopeNote || ""); }, [v.inspectionScopeNote]);
  return (
    <section className="space-y-4">
      <div className="border rounded-xl overflow-hidden bg-white">
        <div className="p-4 grid grid-cols-1 gap-4">
          <div className="border rounded-lg p-4 bg-gray-50 text-gray-800 leading-relaxed">
            <h4 className="font-semibold mb-2">1. ขอบเขตของการตรวจสอบ</h4>
            <p className="mb-2">
              การตรวจสอบครอบคลุมเนื้องานหลักของงานตรวจสอบป้ายและอุปกรณ์ประกอบตามระยะและมาตรฐานที่กำหนด
              โดยอ้างอิงแนวทาง/มาตรการด้านความปลอดภัยและกฎหมายที่เกี่ยวข้องตามไฟล์อ้างอิง
            </p>
            <p className="mb-3">
              ขอบเขตการตรวจมีทั้งงานส่วนโครงสร้างและงานระบบร่วม รวมถึงการทวนสอบเอกสารและเงื่อนไขการใช้งานที่จำเป็น
              พร้อมการบันทึกร่องรอย/หลักฐานตามความเหมาะสม และสรุปการตรวจตามฟอร์มเพื่อการบันทึกผลอย่างเป็นระบบ
            </p>

            <h4 className="font-semibold mb-2">2. หลักเกณฑ์ในการตรวจสอบ</h4>
            <p className="mb-1">การตรวจสอบยึดหลักการตรวจสอบตามกระบวนการมาตรฐานและเอกสารอ้างอิงที่ระบุ</p>
            <div className="space-y-2">
              <div>
                <p className="font-medium">2.1 หลักการตรวจสอบด้านโครงสร้าง/องค์ประกอบหลัก</p>
                <ol className="list-decimal pl-6">
                  <li>การประเมินความมั่นคงแข็งแรงของโครงสร้างรองรับป้าย</li>
                  <li>การตรวจสภาพฐานราก/เสา/คาน/แป</li>
                  <li>การตรวจจุดยึด/แผ่นเพลท/น็อตยึด</li>
                  <li>การตรวจจุดเชื่อม/แนวเชื่อม</li>
                  <li>การตรวจการกัดกร่อน/สนิม/ผุพัง</li>
                  <li>การตรวจแผงป้าย/หน้าป้าย/วัสดุตกแต่ง (ถ้ามี)</li>
                  <li>การตรวจส่วนองค์ประกอบอื่น ๆ (เช่น ราวกันตก/บันได ฯลฯ)</li>
                </ol>
              </div>
              <div>
                <p className="font-medium">2.2 หลักการตรวจงานระบบร่วม</p>
                <ol className="list-decimal pl-6">
                  <li>ระบบไฟฟ้าและอุปกรณ์ไฟฟ้าที่เกี่ยวข้อง</li>
                  <li>ระบบป้องกันฟ้าผ่า (ถ้ามี)</li>
                  <li>ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)</li>
                </ol>
              </div>
              <div>
                <p className="font-medium">2.3 หลักการตรวจงานติดตั้ง</p>
                <p>การตรวจให้เป็นไปตามหลักวิศวกรรมและรายละเอียดงานติดตั้งตามแบบ/มาตรฐาน</p>
                <ol className="list-decimal pl-6">
                  <li>ตำแหน่งการติดตั้ง (ระยะ/แนว)</li>
                  <li>ความเรียบร้อยของงาน</li>
                  <li>การยึดโยง/ค้ำยัน/การเสริมกำลังในจุดวิกฤต</li>
                  <li>การป้องกันการสั่นสะเทือน/การกัดกร่อน/การรั่วซึม ฯลฯ</li>
                  <li>ความเรียบร้อยโดยรวม</li>
                </ol>
              </div>
              <div>
                <p className="font-medium">2.4 หลักการตรวจงานระบบร่วมของป้าย</p>
                <p className="font-medium">2.4.1 ระบบไฟฟ้าและอุปกรณ์ไฟฟ้า</p>
                <ol className="list-decimal pl-6">
                  <li>ความมั่นคงของการเดินสาย/ราง/ท่อ</li>
                  <li>ความเรียบร้อย/การยึดตรึง</li>
                  <li>การป้องกันความชื้น/แดด/ความร้อน</li>
                  <li>ฉนวน/อุปกรณ์ป้องกัน/ตู้/อุปกรณ์ประกอบ</li>
                  <li>แบบแปลนและรายการอุปกรณ์ตามจริง</li>
                </ol>
                <p className="mt-2 mb-1">2.4.1.2 การตรวจความปลอดภัยไฟฟ้าเบื้องต้น</p>
                <ol className="list-decimal pl-6">
                  <li>หลักฐานการทดสอบ/ตรวจสภาพระบบไฟฟ้า</li>
                  <li>มีผู้รับผิดชอบ/ควบคุมระบบไฟฟ้า</li>
                  <li>การจัดการแก้ไขข้อบกพร่องจากการตรวจที่ผ่านมา</li>
                </ol>
                <p className="font-medium mt-2">2.4.2 ระบบป้องกันฟ้าผ่า (ถ้ามี)</p>
                <ol className="list-decimal pl-6">
                  <li>องค์ประกอบหัวล่อฟ้า/ตัวนำ/หลักดิน</li>
                  <li>การต่อประสาน/การต่อเชื่อม</li>
                  <li>จุดต่อกราวด์/ค่าความต้านทานดิน</li>
                  <li>การป้องกันความเสียหายกับอุปกรณ์</li>
                </ol>
                <p className="font-medium mt-2">2.4.3 ระบบอุปกรณ์ประกอบอื่น ๆ (ถ้ามี)</p>
                <p>การตรวจให้เป็นไปตามมาตรฐานความปลอดภัย/คู่มือผู้ผลิตและกฎหมายที่เกี่ยวข้อง</p>
                <ol className="list-decimal pl-6">
                  <li>บันได/ทางเดิน/ราวกันตก</li>
                  <li>จุดยึดเกี่ยว อุปกรณ์กันตก</li>
                  <li>สภาพความเรียบร้อย ความพร้อมใช้งาน</li>
                </ol>
              </div>
            </div>

            {/* ช่องบันทึกเพิ่มเติม (scopeNote) */}
            <div className="flex flex-col gap-1 mt-4">
              <label className="text-sm font-medium text-gray-700">บันทึกขอบเขตการตรวจเพิ่มเติม (ถ้ามี)</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none min-h-28"
                value={scopeDraft}
                onChange={(e) => setScopeDraft(e.target.value)}
                onBlur={(e) => onChange({ inspectionScopeNote: e.target.value })}
                placeholder="บันทึกขอบเขตเพิ่มเติม เช่น พื้นที่ปิดกั้น/เงื่อนไขหน้างาน"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

