const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all dashboard metrics aligned with Follow Up (Prospect table)
router.get('/', verifyToken, async (req, res) => {
  try {
    // 1. KPI Summaries
    const [activeLeads] = await pool.query("SELECT COUNT(*) as count FROM Prospect WHERE UPPER(status) IN ('LEAD', 'PROPOSAL', 'HOLD')");
    const [totalWon] = await pool.query("SELECT COUNT(*) as count, 0 as value FROM Prospect WHERE UPPER(status) IN ('WON', 'DONE')");
    const [totalLoss] = await pool.query("SELECT COUNT(*) as count, 0 as value FROM Prospect WHERE UPPER(status) IN ('LOSS', 'REAL_LOSS')");
    const [revenueWon] = await pool.query("SELECT 0 as sum");

    // 2. Stage Distribution (Pie Chart)
    const [stageRows] = await pool.query("SELECT status, COUNT(*) as count FROM Prospect GROUP BY status");
    const stageDistribution = {
      Lead: 0,
      Proposal: 0,
      Hold: 0,
      Lose: 0,
      Won: 0,
      Done: 0
    };
    stageRows.forEach(row => {
      const statusUpper = row.status.toUpperCase();
      if (statusUpper === 'LEAD') {
        stageDistribution.Lead += row.count;
      } else if (statusUpper === 'PROPOSAL') {
        stageDistribution.Proposal += row.count;
      } else if (statusUpper === 'HOLD') {
        stageDistribution.Hold += row.count;
      } else if (statusUpper === 'LOSS' || statusUpper === 'REAL_LOSS') {
        stageDistribution.Lose += row.count;
      } else if (statusUpper === 'WON') {
        stageDistribution.Won += row.count;
      } else if (statusUpper === 'DONE') {
        stageDistribution.Done += row.count;
      }
    });

    // 3. Urgent Follow Ups (Deadline <= 3 days, or last_contact older than 3 days)
    const [urgentFollowUps] = await pool.query(`
      SELECT 
        p.no_project as id, 
        p.name_project as name, 
        p.client_name as company, 
        c.industry, 
        p.last_contact_date as last_contact, 
        100 as lead_score, 
        CASE 
          WHEN UPPER(p.status) = 'LEAD' THEN 'Lead'
          WHEN UPPER(p.status) = 'PROPOSAL' THEN 'Proposal'
          WHEN UPPER(p.status) = 'HOLD' THEN 'Hold'
          WHEN UPPER(p.status) = 'LOSS' OR UPPER(p.status) = 'LOSE' OR UPPER(p.status) = 'REAL_LOSS' THEN 'Lose'
          WHEN UPPER(p.status) = 'WON' THEN 'Won'
          WHEN UPPER(p.status) = 'DONE' THEN 'Done'
          ELSE 'Lead'
        END as status,
        0 as value, 
        c.contact_phone as phone, 
        c.logo as logo_url, 
        NULL as owner_name
      FROM Prospect p
      LEFT JOIN Client c ON p.client_name = c.name
      WHERE UPPER(p.status) IN ('LEAD', 'PROPOSAL', 'HOLD')
      ORDER BY p.last_contact_date ASC
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
    const trendData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()] + ' ' + d.getFullYear().toString().substr(-2);
      const monthNum = d.getMonth() + 1;
      const yearNum = d.getFullYear();

      // Query database for prospects created in this month
      const [leadsCount] = await pool.query(
        'SELECT COUNT(*) as count FROM Prospect WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ?',
        [monthNum, yearNum]
      );
      
      const [wonCount] = await pool.query(
        "SELECT COUNT(*) as count FROM Prospect WHERE MONTH(createdAt) = ? AND YEAR(createdAt) = ? AND UPPER(status) IN ('WON', 'DONE')",
        [monthNum, yearNum]
      );

      trendData.push({
        month: monthLabel,
        leads: leadsCount[0].count,
        won: wonCount[0].count
      });
    }

    // 6. Sales Funnel Calculation
    const [funnelLeads] = await pool.query("SELECT COUNT(*) as count FROM Prospect");
    const [funnelProposals] = await pool.query("SELECT COUNT(*) as count FROM Prospect WHERE UPPER(status) IN ('PROPOSAL', 'HOLD', 'WON', 'DONE')");
    const [funnelHold] = await pool.query("SELECT COUNT(*) as count FROM Prospect WHERE UPPER(status) IN ('HOLD', 'WON', 'DONE')");
    const [funnelWon] = await pool.query("SELECT COUNT(*) as count FROM Prospect WHERE UPPER(status) IN ('WON', 'DONE')");

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
        totalWonValue: parseFloat(totalWon[0].value || 0),
        totalLossCount: totalLoss[0].count,
        totalLossValue: parseFloat(totalLoss[0].value || 0),
        revenueWon: parseFloat(revenueWon[0].sum || 0)
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
