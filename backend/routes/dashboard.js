const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all dashboard metrics
router.get('/', verifyToken, async (req, res) => {
  try {
    // 1. KPI Summaries
    const [activeLeads] = await pool.query("SELECT COUNT(*) as count FROM clients WHERE status IN ('Lead', 'Proposal', 'Hold')");
    const [totalWon] = await pool.query("SELECT COUNT(*) as count, IFNULL(SUM(value), 0) as value FROM clients WHERE status IN ('Won', 'Done')");
    const [totalLoss] = await pool.query("SELECT COUNT(*) as count, IFNULL(SUM(value), 0) as value FROM clients WHERE status = 'Loss'");
    const [revenueWon] = await pool.query("SELECT IFNULL(SUM(value), 0) as sum FROM clients WHERE status IN ('Won', 'Done')");

    // 2. Stage Distribution (Pie Chart)
    const [stageRows] = await pool.query("SELECT status, COUNT(*) as count FROM clients GROUP BY status");
    const stageDistribution = {
      Lead: 0,
      Proposal: 0,
      Hold: 0,
      Loss: 0,
      Won: 0,
      Done: 0
    };
    stageRows.forEach(row => {
      if (stageDistribution[row.status] !== undefined) {
        stageDistribution[row.status] = row.count;
      }
    });

    // 3. Urgent Follow Ups (Deadline <= 3 days, or last_contact older than 3 days)
    // We fetch leads with status NOT IN ('Won', 'Loss', 'Done') sorted by last_contact ASC
    const [urgentFollowUps] = await pool.query(`
      SELECT c.id, c.name, c.industry, c.last_contact, c.lead_score, c.status, c.value, c.phone, c.logo_url, u.name as owner_name
      FROM clients c
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE c.status IN ('Lead', 'Proposal', 'Hold')
      ORDER BY c.last_contact ASC, c.lead_score DESC
      LIMIT 5
    `);

    // 4. Digital Campaign Performance & ROI (aggregate by channel)
    const [campaignStats] = await pool.query(`
      SELECT 
        channel,
        SUM(budget) as total_budget,
        SUM(spend) as total_spend,
        SUM(conversion) as total_conversions,
        SUM(revenue) as total_revenue,
        COUNT(*) as campaign_count
      FROM campaigns
      GROUP BY channel
    `);

    // Process CAC (Customer Acquisition Cost) per channel
    // CAC = Spend / Conversions
    const cacAnalytics = campaignStats.map(stat => {
      const spend = parseFloat(stat.total_spend) || 0;
      const conversions = parseInt(stat.total_conversions) || 0;
      const budget = parseFloat(stat.total_budget) || 0;
      const revenue = parseFloat(stat.total_revenue) || 0;

      const cac = conversions > 0 ? (spend / conversions) : 0;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      const convRate = budget > 0 ? (conversions / (budget / 50000)) * 100 : 0; // Simulated visitors estimate

      return {
        channel: stat.channel,
        totalBudget: budget,
        totalSpend: spend,
        totalConversions: conversions,
        totalRevenue: revenue,
        cac: Math.round(cac),
        roi: Math.round(roi),
        conversionRate: parseFloat(convRate.toFixed(2)),
        campaignCount: stat.campaign_count
      };
    });

    // 5. Monthly Trend (Leads Created vs Leads Won over the last 6 months)
    // We will generate a structured response for the last 6 months dynamically in JavaScript
    // combining it with actual database records to prevent empty months
    const trendData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(-2);
      const monthNum = d.getMonth() + 1;
      const yearNum = d.getFullYear();

      // Query database for clients created in this month
      const [leadsCount] = await pool.query(
        'SELECT COUNT(*) as count FROM clients WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?',
        [monthNum, yearNum]
      );
      
      const [wonCount] = await pool.query(
        "SELECT COUNT(*) as count FROM clients WHERE MONTH(created_at) = ? AND YEAR(created_at) = ? AND status IN ('Won', 'Done')",
        [monthNum, yearNum]
      );

      trendData.push({
        month: monthLabel,
        leads: leadsCount[0].count,
        won: wonCount[0].count
      });
    }

    // 6. Sales Funnel Calculation
    // Total Leads -> Proposal -> Proposal Review (Hold) -> Won
    const [funnelLeads] = await pool.query("SELECT COUNT(*) as count FROM clients");
    const [funnelProposals] = await pool.query("SELECT COUNT(*) as count FROM clients WHERE status IN ('Proposal', 'Hold', 'Won', 'Done')");
    const [funnelHold] = await pool.query("SELECT COUNT(*) as count FROM clients WHERE status IN ('Hold', 'Won', 'Done')");
    const [funnelWon] = await pool.query("SELECT COUNT(*) as count FROM clients WHERE status IN ('Won', 'Done')");

    const funnelData = [
      { stage: 'Leads (Total)', count: funnelLeads[0].count, percentage: 100 },
      { stage: 'Proposal Sent', count: funnelProposals[0].count, percentage: funnelLeads[0].count > 0 ? Math.round((funnelProposals[0].count / funnelLeads[0].count) * 100) : 0 },
      { stage: 'Proposal Qualified', count: funnelHold[0].count, percentage: funnelLeads[0].count > 0 ? Math.round((funnelHold[0].count / funnelLeads[0].count) * 100) : 0 },
      { stage: 'Closed Won', count: funnelWon[0].count, percentage: funnelLeads[0].count > 0 ? Math.round((funnelWon[0].count / funnelLeads[0].count) * 100) : 0 }
    ];

    res.json({
      summary: {
        activeLeads: activeLeads[0].count,
        totalWonCount: totalWon[0].count,
        totalWonValue: parseFloat(totalWon[0].value),
        totalLossCount: totalLoss[0].count,
        totalLossValue: parseFloat(totalLoss[0].value),
        revenueWon: parseFloat(revenueWon[0].sum)
      },
      stageDistribution,
      urgentFollowUps,
      cacAnalytics,
      trendData,
      funnelData
    });
  } catch (err) {
    console.error('Fetch dashboard metrics error:', err);
    res.status(500).json({ message: 'Gagal mengambil data dashboard.' });
  }
});

module.exports = router;
