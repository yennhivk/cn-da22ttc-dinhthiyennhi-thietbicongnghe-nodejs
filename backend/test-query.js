const db = require('./config/database');

async function test() {
    try {
        const { query, params } = { search: 'laptop' }; // Simulate
        const searchStr = 'laptop'.trim();
        const searchPattern = \%\%\;
        const exactPattern = \%\%\;

        let searchCondition = \(sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR EXISTS (
                SELECT 1 FROM anh_san_pham a 
                WHERE a.ma_san_pham = sp.ma_san_pham 
                AND a.duong_dan_anh LIKE ?
            ))\;
        let mockParams = [exactPattern, exactPattern, exactPattern, searchPattern];
        
        let q = \SELECT sp.ma_san_pham, sp.ten_san_pham, dm.ten_danh_muc FROM san_pham sp LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc WHERE \ + searchCondition;
        
        const [res] = await db.query(q, mockParams);
        console.log('Results:', res);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
